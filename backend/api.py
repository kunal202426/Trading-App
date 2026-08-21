import sys, os, json, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import pandas as pd
from alpha_vantage import user_symbol_to_av, get_ohlcv_for_period, get_daily_ohlcv
import gemini_client

def _rsi(close, window=14):
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(com=window - 1, min_periods=window).mean()
    loss = (-delta.clip(upper=0)).ewm(com=window - 1, min_periods=window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def _macd(close, fast=12, slow=26, signal=9):
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    line = ema_fast - ema_slow
    sig  = line.ewm(span=signal, adjust=False).mean()
    return line, sig, line - sig

def _bollinger(close, window=20, dev=2):
    mid = close.rolling(window).mean()
    std = close.rolling(window).std()
    return mid + dev * std, mid - dev * std, mid

_SNAPSHOT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "prediction_snapshots.json")
_snapshots: dict = {}
if os.path.exists(_SNAPSHOT_PATH):
    try:
        with open(_SNAPSHOT_PATH) as _f:
            _snapshots = json.load(_f)
        print(f"[snapshots] Loaded {len(_snapshots)} pre-computed snapshots from {_SNAPSHOT_PATH}")
    except Exception as _e:
        print(f"[snapshots] Could not load snapshots: {_e}")

app = FastAPI(title="Stock Prediction API")

_env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ysil.vercel.app",
        *_env_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def resolve_symbol(symbol: str) -> str:
    return user_symbol_to_av(symbol)

_predictor = None
_predictor_lock = threading.Lock()

# Symbols to pre-train at startup — covers the most-used ones from logs
PRETRAIN_SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK",
                    "ICICIBANK", "COASTCORP", "WANBURY", "526071"]

# Per-symbol status: None | "training" | "ready" | "error"
_model_status: dict = {}
_model_status_lock = threading.Lock()


def _get_predictor():
    global _predictor
    if _predictor is None:
        with _predictor_lock:
            if _predictor is None:
                from dynamic_predictor import DynamicStockPredictor
                _predictor = DynamicStockPredictor()
    return _predictor


def _train_symbol(symbol: str):
    with _model_status_lock:
        if _model_status.get(symbol) == "training":
            return                          # already in progress
        _model_status[symbol] = "training"
    try:
        _get_predictor().load_or_train(symbol)
        with _model_status_lock:
            _model_status[symbol] = "ready"
        print(f"[warmup] {symbol} ready")
    except Exception as e:
        with _model_status_lock:
            _model_status[symbol] = "error"
        print(f"[warmup] {symbol} failed: {e}")


@app.on_event("startup")
def startup_pretrain():
    def _run():
        print(f"[warmup] Starting background pre-training: {', '.join(PRETRAIN_SYMBOLS)}")
        for sym in PRETRAIN_SYMBOLS:
            _train_symbol(sym)
        print("[warmup] All pre-training complete.")

    threading.Thread(target=_run, daemon=True).start()


@app.get("/health")
def health():
    with _model_status_lock:
        status_snapshot = dict(_model_status)
    ready  = [s for s, v in status_snapshot.items() if v == "ready"]
    training = [s for s, v in status_snapshot.items() if v == "training"]
    return {
        "status":   "ok",
        "timestamp": str(datetime.now()),
        "models_ready":    ready,
        "models_training": training,
    }


@app.get("/predict/{symbol}")
def predict(symbol: str):
    sym = symbol.upper()

    with _model_status_lock:
        status = _model_status.get(sym)

    if status is None:
        threading.Thread(target=_train_symbol, args=(sym,), daemon=True).start()
        if sym in _snapshots:
            snap = dict(_snapshots[sym])
            snap["_snapshot"] = True
            return snap
        return JSONResponse(status_code=202, content={
            "status":  "warming_up",
            "symbol":  sym,
            "message": f"Model for {sym} is being trained. Retry in ~2 minutes.",
        })

    if status == "training":
        if sym in _snapshots:
            snap = dict(_snapshots[sym])
            snap["_snapshot"] = True
            return snap
        return JSONResponse(status_code=202, content={
            "status":  "warming_up",
            "symbol":  sym,
            "message": f"Model for {sym} is still training. Retry in ~60 seconds.",
        })

    if status == "error":
        if sym in _snapshots:
            snap = dict(_snapshots[sym])
            snap["_snapshot"] = True
            return snap
        raise HTTPException(status_code=503, detail=f"Model training failed for {sym}. No snapshot available.")

    try:
        result = _get_predictor().predict_now(sym)
        if gemini_client.is_configured():
            result["ai_take"] = gemini_client.generate_ai_take(sym, result)
        return result
    except ValueError as e:
        detail = str(e)
        if any(k in detail for k in ("Cannot find", "Could not download", "No data")):
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=500, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/batch/stocks")
def batch_predict(symbols: str):
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return _get_predictor().batch_predict(symbol_list)

@app.get("/chart/{symbol}")
def get_chart(symbol: str, period: str = "6mo", interval: str = "1d"):
    try:
        resolved = resolve_symbol(symbol.upper())
        hist = get_ohlcv_for_period(resolved, period=period, interval=interval)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data found")

        hist['rsi']         = _rsi(hist['close'])
        macd_line, macd_sig, macd_hist_col = _macd(hist['close'])
        hist['macd_line']   = macd_line
        hist['macd_signal'] = macd_sig
        hist['macd_hist']   = macd_hist_col
        bb_upper, bb_lower, bb_mid = _bollinger(hist['close'])
        hist['bb_upper']    = bb_upper
        hist['bb_lower']    = bb_lower
        hist['bb_mid']      = bb_mid

        candles = []
        for _, row in hist.iterrows():
            candles.append({
                "date":        str(row["date"].date()),
                "open":        round(float(row["open"]), 2),
                "high":        round(float(row["high"]), 2),
                "low":         round(float(row["low"]), 2),
                "close":       round(float(row["close"]), 2),
                "volume":      int(row["volume"]),
                "rsi":         round(float(row["rsi"]), 1)         if not pd.isna(row["rsi"])         else None,
                "macd_line":   round(float(row["macd_line"]), 3)   if not pd.isna(row["macd_line"])   else None,
                "macd_signal": round(float(row["macd_signal"]), 3) if not pd.isna(row["macd_signal"]) else None,
                "macd_hist":   round(float(row["macd_hist"]), 3)   if not pd.isna(row["macd_hist"])   else None,
                "bb_upper":    round(float(row["bb_upper"]), 2)    if not pd.isna(row["bb_upper"])    else None,
                "bb_lower":    round(float(row["bb_lower"]), 2)    if not pd.isna(row["bb_lower"])    else None,
                "bb_mid":      round(float(row["bb_mid"]), 2)      if not pd.isna(row["bb_mid"])      else None,
            })

        latest = candles[-1]["close"]
        prev    = candles[-2]["close"] if len(candles) > 1 else latest
        change  = round(latest - prev, 2)
        changePct = round((change / prev) * 100, 2)

        return {
            "symbol":    symbol.upper(),
            "candles":   candles,
            "latest":    latest,
            "change":    change,
            "changePct": changePct,
            "high52w":   round(max(c["high"] for c in candles), 2),
            "low52w":    round(min(c["low"] for c in candles), 2),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"CHART ERROR [{symbol}]: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/news/{symbol}")
async def get_news(symbol: str):
    if not gemini_client.is_configured():
        raise HTTPException(status_code=503, detail="News service not configured (GEMINI_API_KEY missing).")
    try:
        sym = symbol.upper()
        news = await gemini_client.fetch_symbol_news(sym)
        india_sentiment = await gemini_client.fetch_broad_sentiment("india", "India equities / NSE / Sensex / Nifty")
        global_sentiment = await gemini_client.fetch_broad_sentiment("global", "global equity markets / US Federal Reserve / world economy")

        return {
            "symbol": sym,
            "articles": news["articles"],
            "sentiment": {
                "symbol_narrative": news["overall_sentiment"],
                "india_equities": india_sentiment,
                "global_macro": global_sentiment,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    try:
        clean = symbol.upper().replace(".NS", "").replace(".BO", "").strip()

        mock_data = {
            "INFY": {
                "symbol": "INFY",
                "market_cap": "₹7.9T",
                "pe_ratio": 28.4,
                "roe": 31.2,
                "debt_to_equity": 0.09,
                "eps_growth": 12.8,
                "dividend_yield": 2.1,
                "sector": "IT Services",
                "high_52w": "₹1,970",
                "low_52w": "₹1,340",
            },
            "RELIANCE": {
                "symbol": "RELIANCE",
                "market_cap": "₹19.4T",
                "pe_ratio": 24.8,
                "roe": 8.7,
                "debt_to_equity": 0.42,
                "eps_growth": 11.3,
                "dividend_yield": 0.36,
                "sector": "Energy",
                "high_52w": "₹3,217",
                "low_52w": "₹2,220",
            },
            "TCS": {
                "symbol": "TCS",
                "market_cap": "₹14.7T",
                "pe_ratio": 30.6,
                "roe": 43.1,
                "debt_to_equity": 0.12,
                "eps_growth": 9.4,
                "dividend_yield": 1.8,
                "sector": "IT Services",
                "high_52w": "₹4,585",
                "low_52w": "₹3,331",
            },
            "HDFCBANK": {
                "symbol": "HDFCBANK",
                "market_cap": "₹12.3T",
                "pe_ratio": 19.2,
                "roe": 16.8,
                "debt_to_equity": 0.0,
                "eps_growth": 15.6,
                "dividend_yield": 1.2,
                "sector": "Banking",
                "high_52w": "₹1,880",
                "low_52w": "₹1,363",
            },
            "ICICIBANK": {
                "symbol": "ICICIBANK",
                "market_cap": "₹8.9T",
                "pe_ratio": 18.7,
                "roe": 17.3,
                "debt_to_equity": 0.0,
                "eps_growth": 18.2,
                "dividend_yield": 0.9,
                "sector": "Banking",
                "high_52w": "₹1,257",
                "low_52w": "₹912",
            },
        }

        has_coverage = clean in mock_data
        result = dict(mock_data.get(clean, {
            "symbol": clean,
            "market_cap": "—",
            "pe_ratio": None,
            "roe": None,
            "debt_to_equity": None,
            "eps_growth": None,
            "dividend_yield": None,
            "sector": "—",
            "high_52w": "—",
            "low_52w": "—",
        }))
        # All fundamentals figures here are hardcoded, not sourced live — flag
        # it plainly rather than let the UI imply a real-time read.
        result["is_demo_data"] = True
        result["has_coverage"] = has_coverage

        return result
    except Exception as e:
        print(f"FUNDAMENTALS ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Macro / Regime dashboard — was 100% hardcoded mock data, now real ───────

_INDEX_SYMBOLS = {"nifty": "^NSEI", "spx": "^GSPC", "eurostoxx": "^STOXX50E"}
_macro_cache: dict = {}  # short-TTL cache for the indices+VIX portion
_seasonality_cache: dict = {}  # long-TTL — computed from years of history, doesn't shift daily


def _cache_read(store, key, ttl_s):
    entry = store.get(key)
    if entry and (datetime.now() - entry["at"]).total_seconds() < ttl_s:
        return entry["value"]
    return None


def _cache_write(store, key, value):
    store[key] = {"value": value, "at": datetime.now()}


def _normalized_index_series(period: str):
    """Fetch NIFTY/S&P 500/EuroStoxx daily closes, align on a shared trading
    calendar (forward-filled across each other's holidays), and rebase each
    to 100 at the first shared date so they're visually comparable."""
    raw = {}
    for key, sym in _INDEX_SYMBOLS.items():
        df = get_ohlcv_for_period(sym, period=period, interval="1d")
        if not df.empty:
            raw[key] = df.set_index(df["date"].dt.strftime("%Y-%m-%d"))["close"]

    if not raw:
        return []

    all_dates = sorted(set().union(*[s.index for s in raw.values()]))
    series = []
    bases = {}
    for d in all_dates:
        row = {"date": d}
        for key, s in raw.items():
            val = s.get(d)
            if val is None:
                # carry forward the last known close across a symbol's local holiday
                prior = [s.get(dd) for dd in all_dates if dd <= d and s.get(dd) is not None]
                val = prior[-1] if prior else None
            if val is None:
                continue
            bases.setdefault(key, val)
            row[key] = round(val / bases[key] * 100, 2)
        series.append(row)
    return series


def _compute_nifty_seasonality():
    """Real monthly seasonality from NIFTY 50's full available history —
    for each calendar month, the whole-month return (last close / first
    close of that month) in every year on record, averaged; win rate is the
    share of those years where the month was positive. Not a hand-picked
    example — a real stat over however many years of data are available."""
    cached = _cache_read(_seasonality_cache, "nifty", ttl_s=24 * 60 * 60)
    if cached is not None:
        return cached
    try:
        # Yahoo silently drops to monthly bars for range="max" over decades —
        # request an explicit start date instead to force real daily rows.
        end_str = datetime.now().strftime("%Y-%m-%d")
        start_str = (datetime.now() - timedelta(days=20 * 365)).strftime("%Y-%m-%d")
        df = get_daily_ohlcv("^NSEI", start_date=start_str, end_date=end_str)
        df = df.sort_values("date")
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month

        monthly = df.groupby(["year", "month"])["close"].agg(first="first", last="last")
        monthly["ret"] = monthly["last"] / monthly["first"] - 1

        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        result = []
        for m in range(1, 13):
            if m not in monthly.index.get_level_values("month"):
                continue
            sub = monthly.xs(m, level="month")["ret"]
            result.append({
                "month": month_names[m - 1],
                "avg": round(float(sub.mean()) * 100, 2),
                "winRate": round(float((sub > 0).mean()) * 100, 1),
                "years": int(len(sub)),
            })
        _cache_write(_seasonality_cache, "nifty", result)
        return result
    except Exception:
        return cached or []


@app.get("/debug/gemini")
async def debug_gemini():
    """Temporary — reports the exact Gemini failure mode instead of the
    silent fallback the real endpoints use. Remove once diagnosed."""
    import traceback
    out = {}
    client = gemini_client._get_client()

    try:
        r = await client.aio.models.generate_content(model=gemini_client.GEMINI_MODEL, contents="Say OK.")
        out["plain"] = {"ok": True, "text": r.text}
    except Exception as e:
        out["plain"] = {"ok": False, "error": str(e), "trace": traceback.format_exc()[-1500:]}

    try:
        from google.genai import types
        r = await client.aio.models.generate_content(
            model=gemini_client.GEMINI_MODEL, contents="What is today's date?",
            config=types.GenerateContentConfig(tools=[types.Tool(google_search=types.GoogleSearch())]),
        )
        out["grounded"] = {"ok": True, "text": r.text}
    except Exception as e:
        out["grounded"] = {"ok": False, "error": str(e), "trace": traceback.format_exc()[-1500:]}

    try:
        from google.genai import types
        r = await client.aio.models.generate_content(
            model=gemini_client.GEMINI_MODEL, contents="Sentiment for India equities?",
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                response_schema=gemini_client.SentimentReading,
            ),
        )
        out["grounded_structured"] = {"ok": True, "parsed": str(r.parsed), "text": r.text}
    except Exception as e:
        out["grounded_structured"] = {"ok": False, "error": str(e), "trace": traceback.format_exc()[-1500:]}

    return out


@app.get("/macro/overview")
async def get_macro_overview(horizon: str = "3mo"):
    try:
        index_series = _cache_read(_macro_cache, f"index:{horizon}", ttl_s=15 * 60)
        if index_series is None:
            index_series = _normalized_index_series(horizon)
            _cache_write(_macro_cache, f"index:{horizon}", index_series)

        vix = _cache_read(_macro_cache, "vix", ttl_s=15 * 60)
        if vix is None:
            india_vix_df = get_ohlcv_for_period("^INDIAVIX", period="5d", interval="1d")
            global_vix_df = get_ohlcv_for_period("^VIX", period="5d", interval="1d")
            vix = {
                "india": round(float(india_vix_df.iloc[-1]["close"]), 2) if not india_vix_df.empty else None,
                "global": round(float(global_vix_df.iloc[-1]["close"]), 2) if not global_vix_df.empty else None,
            }
            _cache_write(_macro_cache, "vix", vix)

        seasonality = _compute_nifty_seasonality()

        sentiment = {"india": None, "global": None}
        hotspots = []
        if gemini_client.is_configured():
            sentiment["india"] = await gemini_client.fetch_broad_sentiment("india", "India equities / NSE / Sensex / Nifty")
            sentiment["global"] = await gemini_client.fetch_broad_sentiment("global", "global equity markets / US Federal Reserve / world economy")
            hotspots = await gemini_client.fetch_geopolitical_hotspots()

        return {
            "index_series": index_series,
            "vix": vix,
            "seasonality": seasonality,
            "sentiment": sentiment,
            "hotspots": hotspots,
            "hotspots_available": gemini_client.is_configured(),
        }
    except Exception as e:
        import traceback
        print("MACRO OVERVIEW ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
