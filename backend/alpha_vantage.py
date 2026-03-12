"""
Stock data client — queries Yahoo Finance HTTP API directly (no yfinance library).
Avoids yfinance's rate-limit / IP-block issues while using the same data source.

Alpha Vantage key is retained as an env var for potential premium use later.
Public interface is unchanged so api.py / dynamic_predictor / layer1 need no edits.
"""
import os
import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "XILS5XXXXXB2G49I")

_YF_BASE  = "https://query1.finance.yahoo.com/v8/finance/chart"
_YF_BASE2 = "https://query2.finance.yahoo.com/v8/finance/chart"   # fallback

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept":          "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

# Static alias map: user-facing name → Yahoo Finance ticker
_SYMBOL_ALIASES = {
    "TATAMOTORS":    "TATAMOTORS.NS",
    "TATAMOTORSDVR": "TATAMOTORS.NS",
    "M&M":           "M%26M.NS",
    "MM":            "M%26M.NS",
    "LT":            "LT.NS",
    "BAJAJ-AUTO":    "BAJAJ-AUTO.NS",
    "NIFTY50":       "^NSEI",
    "SENSEX":        "^BSESN",
    "526071":        "526071.BO",
    "COASTCORP":     "COASTCORP.NS",
    "WANBURY":       "WANBURY.NS",
}


def user_symbol_to_av(symbol: str) -> str:
    """
    Convert a user-facing symbol to Yahoo Finance ticker format.
    (Function kept as 'to_av' so existing imports in api.py / dynamic_predictor
    / layer1 require no changes.)

    Examples:
      HDFCBANK    → HDFCBANK.NS
      RELIANCE    → RELIANCE.NS
      526071      → 526071.BO
      NIFTY50     → ^NSEI
      NSE:INFY    → INFY.NS   (Alpha Vantage format passthrough)
    """
    sym = symbol.upper().replace("%26", "&")

    if sym in _SYMBOL_ALIASES:
        return _SYMBOL_ALIASES[sym]

    # Handle NSE:/BSE: prefixes from any previous code
    if sym.startswith("NSE:"):
        return sym[4:] + ".NS"
    if sym.startswith("BSE:"):
        return sym[4:] + ".BO"

    # Already in Yahoo Finance format
    if sym.endswith(".NS") or sym.endswith(".BO") or sym.startswith("^"):
        return sym

    # BSE numeric codes
    if sym.isdigit():
        return sym + ".BO"

    # Default: assume NSE
    return sym + ".NS"


# ── period / interval helpers ────────────────────────────────────────────────

def _period_to_range(period: str) -> str:
    mapping = {
        "1d": "1d", "5d": "5d", "1mo": "1mo", "3mo": "3mo",
        "6mo": "6mo", "1y": "1y", "2y": "2y", "5y": "5y", "max": "max",
    }
    return mapping.get(period.lower(), "6mo")


def _yf_interval_to_av(interval: str) -> Optional[str]:
    """Return None for daily (use daily endpoint), else return intraday interval."""
    intraday = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"}
    return interval.lower() if interval.lower() in intraday else None


# ── core HTTP fetcher ─────────────────────────────────────────────────────────

def _fetch_yf_chart(yf_symbol: str, range_: str = "6mo",
                    interval: str = "1d",
                    period1: int = None, period2: int = None) -> dict:
    """
    Call Yahoo Finance chart API, retrying on query2 if query1 fails.
    Prefer period1/period2 (unix timestamps) over range when available — more reliable.
    Returns the raw result[0] dict.
    """
    if period1 and period2:
        params = {
            "period1":        str(period1),
            "period2":        str(period2),
            "interval":       interval,
            "includePrePost": "false",
            "events":         "div,splits",
        }
    else:
        params = {
            "range":          range_,
            "interval":       interval,
            "includePrePost": "false",
            "events":         "div,splits",
        }

    last_err: Exception = ValueError(f"No data for {yf_symbol}")
    for base in (_YF_BASE, _YF_BASE2):
        try:
            url  = f"{base}/{yf_symbol}"
            resp = requests.get(url, headers=_HEADERS, params=params, timeout=15)
            resp.raise_for_status()
            data   = resp.json()
            result = data.get("chart", {}).get("result")
            if result:
                return result[0]
            err = data.get("chart", {}).get("error") or {}
            last_err = ValueError(
                f"Yahoo Finance: {err.get('description', 'No data returned')} "
                f"(symbol={yf_symbol})"
            )
        except requests.HTTPError as e:
            last_err = e
            time.sleep(0.5)
        except ValueError:
            raise
        except Exception as e:
            last_err = e
            time.sleep(0.5)

    raise last_err


def _chart_to_df(result: dict) -> pd.DataFrame:
    """Convert a Yahoo Finance chart result dict to a tidy DataFrame."""
    timestamps = result.get("timestamp", [])
    if not timestamps:
        return pd.DataFrame()

    quotes       = result["indicators"]["quote"][0]
    adjclose_raw = (
        result["indicators"].get("adjclose", [{}])[0].get("adjclose")
        or quotes.get("close", [])
    )

    # Convert UTC epoch → IST date (NSE trading hours are all within UTC day)
    dates = (
        pd.to_datetime(timestamps, unit="s", utc=True)
          .tz_convert("Asia/Kolkata")
          .normalize()
          .tz_localize(None)
    )

    df = pd.DataFrame({
        "date":           dates,
        "open":           [float(v) if v is not None else float("nan") for v in quotes.get("open",   [])],
        "high":           [float(v) if v is not None else float("nan") for v in quotes.get("high",   [])],
        "low":            [float(v) if v is not None else float("nan") for v in quotes.get("low",    [])],
        "close":          [float(v) if v is not None else float("nan") for v in quotes.get("close",  [])],
        "volume":         [int(v)   if v is not None else 0            for v in quotes.get("volume", [])],
        "adjusted_close": [float(v) if v is not None else float("nan") for v in adjclose_raw],
    })
    return df.dropna(subset=["close"]).reset_index(drop=True)


# ── public API (interface unchanged from original alpha_vantage.py) ───────────

def get_daily_ohlcv(av_symbol: str, start_date: Optional[str] = None,
                    end_date: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch daily OHLCV data via Yahoo Finance.
    av_symbol: Yahoo Finance ticker (HDFCBANK.NS, ^NSEI, 526071.BO …)
    Returns DataFrame: date, open, high, low, close, volume, adjusted_close
    """
    # Use timestamp-based query when dates are provided — more reliable than range=max
    if start_date:
        p1 = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
        p2 = int((datetime.strptime(end_date, "%Y-%m-%d") if end_date
                  else datetime.now()).timestamp())
        result = _fetch_yf_chart(av_symbol, interval="1d", period1=p1, period2=p2)
    else:
        result = _fetch_yf_chart(av_symbol, range_="max", interval="1d")

    df = _chart_to_df(result)

    if start_date:
        df = df[df["date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["date"] <= pd.to_datetime(end_date)]

    return df.reset_index(drop=True)


def get_intraday_ohlcv(av_symbol: str, av_interval: str = "5min",
                       outputsize: str = "full") -> pd.DataFrame:
    """
    Fetch intraday OHLCV.
    av_interval: Alpha Vantage style ('1min','5min','15min','30min','60min')
    """
    iv_map = {"1min": "1m", "5min": "5m", "15min": "15m",
              "30min": "30m", "60min": "60m"}
    yf_interval = iv_map.get(av_interval, "5m")
    range_      = "1d" if outputsize == "compact" else "5d"
    result      = _fetch_yf_chart(av_symbol, range_=range_, interval=yf_interval)
    return _chart_to_df(result)


def get_quote(av_symbol: str) -> dict:
    """
    Fetch latest quote via Yahoo Finance meta fields.
    Returns dict: price, open, high, low, volume, prev_close, change, change_pct
    """
    result     = _fetch_yf_chart(av_symbol, range_="5d", interval="1d")
    meta       = result.get("meta", {})
    price      = float(meta.get("regularMarketPrice") or meta.get("previousClose") or 0)
    prev_close = float(meta.get("previousClose")      or meta.get("chartPreviousClose") or 0)
    change     = round(price - prev_close, 2)
    change_pct = round((change / prev_close * 100) if prev_close else 0, 2)

    return {
        "price":      price,
        "open":       float(meta.get("regularMarketOpen",    price) or price),
        "high":       float(meta.get("regularMarketDayHigh", price) or price),
        "low":        float(meta.get("regularMarketDayLow",  price) or price),
        "volume":     int(meta.get("regularMarketVolume", 0) or 0),
        "prev_close": prev_close,
        "change":     change,
        "change_pct": change_pct,
    }


def get_ohlcv_for_period(av_symbol: str, period: str = "6mo",
                         interval: str = "1d") -> pd.DataFrame:
    """
    High-level helper used by the /chart endpoint.
    Converts yfinance-style period/interval to Yahoo Finance API calls.
    """
    yf_range    = _period_to_range(period)
    av_interval = _yf_interval_to_av(interval)

    if av_interval is None:
        result = _fetch_yf_chart(av_symbol, range_=yf_range, interval="1d")
    else:
        result = _fetch_yf_chart(av_symbol, range_=yf_range, interval=av_interval)

    df = _chart_to_df(result)
    if av_interval is not None:
        df["adjusted_close"] = df["close"]
    return df
