"""
Alpha Vantage client — replaces yfinance for stock data.
API docs: https://www.alphavantage.co/documentation/

Symbol format for Indian stocks:
  NSE: NSE:INFY, NSE:TCS, NSE:RELIANCE
  BSE: BSE:500325, BSE:500696
"""
import os
import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "XILS5XXXXXB2G49I")
_BASE = "https://www.alphavantage.co/query"

# Free tier: 5 calls/min — enforce at least 12 s between calls
_CALL_INTERVAL = 12.0
_last_call: float = 0.0

# Static alias map: user-facing name → Alpha Vantage symbol
_SYMBOL_ALIASES = {
    "TATAMOTORS":    "NSE:TATAMOTORS",
    "TATAMOTORSDVR": "NSE:TATAMOTORS",
    "M&M":           "NSE:M&M",
    "MM":            "NSE:M&M",
    "LT":            "NSE:LT",
    "BAJAJ-AUTO":    "NSE:BAJAJ-AUTO",
    "NIFTY50":       "NSE:NIFTY50",
    "SENSEX":        "BSE:SENSEX",
    "526071":        "BSE:526071",
    "COASTCORP":     "NSE:COASTCORP",
    "WANBURY":       "NSE:WANBURY",
    # yfinance-style tickers that code may pass through
    "^NSEI":         "NSE:NIFTY50",
    "^BSESN":        "BSE:SENSEX",
}


def _throttle():
    """Sleep if needed to stay within 5 calls/min rate limit."""
    global _last_call
    elapsed = time.time() - _last_call
    if elapsed < _CALL_INTERVAL:
        time.sleep(_CALL_INTERVAL - elapsed)
    _last_call = time.time()


def user_symbol_to_av(symbol: str) -> str:
    """
    Convert a user-facing or yfinance-style symbol to Alpha Vantage format.
    Examples:
      INFY        → NSE:INFY
      INFY.NS     → NSE:INFY
      500325.BO   → BSE:500325
      TATAMOTORS  → NSE:TATAMOTORS (via alias)
      M%26M.NS    → NSE:M&M
    """
    sym = symbol.upper().replace("%26", "&")

    # Check static alias table first
    if sym in _SYMBOL_ALIASES:
        return _SYMBOL_ALIASES[sym]

    # yfinance suffix stripping
    if sym.endswith(".NS"):
        return "NSE:" + sym[:-3]
    if sym.endswith(".BO"):
        return "BSE:" + sym[:-3]

    # Already in AV format
    if ":" in sym:
        return sym

    # Default: assume NSE
    return "NSE:" + sym


def _period_to_dates(period: str):
    """Convert yfinance-style period string to (start_date, end_date) tuple."""
    end = datetime.today()
    mapping = {
        "1d":  1,
        "5d":  5,
        "1mo": 30,
        "3mo": 90,
        "6mo": 180,
        "1y":  365,
        "2y":  730,
        "5y":  1825,
        "max": 365 * 20,
    }
    days = mapping.get(period.lower(), 180)
    return (end - timedelta(days=days)).strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def _yf_interval_to_av(interval: str) -> Optional[str]:
    """Map yfinance interval to Alpha Vantage intraday interval string, or None for daily."""
    mapping = {
        "1m":  "1min",
        "5m":  "5min",
        "15m": "15min",
        "30m": "30min",
        "1h":  "60min",
        "60m": "60min",
        "90m": "60min",  # closest available
    }
    return mapping.get(interval.lower())  # None means use daily endpoint


def get_daily_ohlcv(av_symbol: str, start_date: Optional[str] = None,
                    end_date: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch adjusted daily OHLCV from Alpha Vantage TIME_SERIES_DAILY_ADJUSTED.
    Returns a DataFrame with columns: date, open, high, low, close, volume, adjusted_close
    Optionally filters to [start_date, end_date] (YYYY-MM-DD strings).
    """
    _throttle()
    params = {
        "function":   "TIME_SERIES_DAILY_ADJUSTED",
        "symbol":     av_symbol,
        "outputsize": "full",
        "apikey":     ALPHA_VANTAGE_KEY,
        "datatype":   "json",
    }
    resp = requests.get(_BASE, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if "Error Message" in data:
        raise ValueError(f"Alpha Vantage: {data['Error Message']} (symbol={av_symbol})")
    if "Note" in data:
        raise RuntimeError(f"Alpha Vantage rate limit: {data['Note']}")
    if "Information" in data:
        raise RuntimeError(f"Alpha Vantage API limit: {data['Information']}")

    ts = data.get("Time Series (Daily)", {})
    if not ts:
        raise ValueError(f"No daily data returned for {av_symbol}")

    records = []
    for date_str, v in ts.items():
        records.append({
            "date":           pd.to_datetime(date_str),
            "open":           float(v.get("1. open", 0)),
            "high":           float(v.get("2. high", 0)),
            "low":            float(v.get("3. low", 0)),
            "close":          float(v.get("4. close", 0)),
            "volume":         int(float(v.get("6. volume", 0))),
            "adjusted_close": float(v.get("5. adjusted close", v.get("4. close", 0))),
        })

    df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)

    if start_date:
        df = df[df["date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["date"] <= pd.to_datetime(end_date)]

    return df.reset_index(drop=True)


def get_intraday_ohlcv(av_symbol: str, av_interval: str = "5min",
                       outputsize: str = "full") -> pd.DataFrame:
    """
    Fetch intraday OHLCV from Alpha Vantage TIME_SERIES_INTRADAY.
    av_interval: '1min' | '5min' | '15min' | '30min' | '60min'
    Returns DataFrame with columns: date, open, high, low, close, volume
    """
    _throttle()
    params = {
        "function":   "TIME_SERIES_INTRADAY",
        "symbol":     av_symbol,
        "interval":   av_interval,
        "outputsize": outputsize,
        "adjusted":   "true",
        "apikey":     ALPHA_VANTAGE_KEY,
        "datatype":   "json",
    }
    resp = requests.get(_BASE, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if "Error Message" in data:
        raise ValueError(f"Alpha Vantage intraday: {data['Error Message']}")
    if "Note" in data:
        raise RuntimeError(f"Alpha Vantage rate limit: {data['Note']}")
    if "Information" in data:
        raise RuntimeError(f"Alpha Vantage API limit: {data['Information']}")

    key = f"Time Series ({av_interval})"
    ts = data.get(key, {})
    if not ts:
        raise ValueError(f"No intraday data returned for {av_symbol} @ {av_interval}")

    records = []
    for dt_str, v in ts.items():
        records.append({
            "date":   pd.to_datetime(dt_str),
            "open":   float(v.get("1. open", 0)),
            "high":   float(v.get("2. high", 0)),
            "low":    float(v.get("3. low", 0)),
            "close":  float(v.get("4. close", 0)),
            "volume": int(float(v.get("5. volume", 0))),
        })

    return pd.DataFrame(records).sort_values("date").reset_index(drop=True)


def get_quote(av_symbol: str) -> dict:
    """
    Fetch the latest quote via Alpha Vantage GLOBAL_QUOTE.
    Returns dict with: price, open, high, low, volume, prev_close, change, change_pct
    """
    _throttle()
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol":   av_symbol,
        "apikey":   ALPHA_VANTAGE_KEY,
    }
    resp = requests.get(_BASE, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    if "Error Message" in data:
        raise ValueError(f"Alpha Vantage quote error: {data['Error Message']}")
    if "Note" in data:
        raise RuntimeError(f"Alpha Vantage rate limit: {data['Note']}")
    if "Information" in data:
        raise RuntimeError(f"Alpha Vantage API limit: {data['Information']}")

    q = data.get("Global Quote", {})
    if not q or not q.get("05. price"):
        raise ValueError(f"No quote data returned for {av_symbol}")

    change_pct_str = q.get("10. change percent", "0%").replace("%", "").strip()
    try:
        change_pct = float(change_pct_str)
    except ValueError:
        change_pct = 0.0

    return {
        "price":      float(q.get("05. price", 0)),
        "open":       float(q.get("02. open", 0)),
        "high":       float(q.get("03. high", 0)),
        "low":        float(q.get("04. low", 0)),
        "volume":     int(float(q.get("06. volume", 0))),
        "prev_close": float(q.get("08. previous close", 0)),
        "change":     float(q.get("09. change", 0)),
        "change_pct": change_pct,
    }


def get_ohlcv_for_period(av_symbol: str, period: str = "6mo",
                         interval: str = "1d") -> pd.DataFrame:
    """
    High-level helper used by the chart endpoint.
    Converts yfinance-style period/interval to AV calls.
    Returns DataFrame with columns: date, open, high, low, close, volume, adjusted_close
    """
    av_interval = _yf_interval_to_av(interval)
    start_date, end_date = _period_to_dates(period)

    if av_interval is None:
        # Daily data
        return get_daily_ohlcv(av_symbol, start_date=start_date, end_date=end_date)
    else:
        # Intraday data — use compact for short periods to save a call
        outputsize = "compact" if period in ("1d", "5d") else "full"
        df = get_intraday_ohlcv(av_symbol, av_interval=av_interval, outputsize=outputsize)
        df = df[df["date"] >= pd.to_datetime(start_date)]
        # adjusted_close not available for intraday — use close
        df["adjusted_close"] = df["close"]
        return df.reset_index(drop=True)
