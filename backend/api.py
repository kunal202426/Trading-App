import sys, os
# Ensure backend/ siblings (dynamic_predictor, layer*.py etc.) are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import yfinance as yf
import httpx

# Vercel filesystem is read-only — redirect yfinance cache to /tmp
yf.set_tz_cache_location("/tmp/yfinance_cache")

# --------------- inline technical indicators (no ta dependency) --
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
app = FastAPI(title="Stock Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- symbol resolution (no ML needed) ---------------
SYMBOL_ALIASES = {
    "TATAMOTORS":    "TMCV.NS",
    "TATAMOTORSDVR": "TMCV.NS",
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

def resolve_symbol(symbol: str) -> str:
    sym = symbol.upper()
    if sym in SYMBOL_ALIASES:
        return SYMBOL_ALIASES[sym]
    # BSE numeric codes → .BO, everything else → .NS
    if sym.isdigit():
        return sym + ".BO"
    return sym + ".NS"

# --------------- lazy predictor (heavy ML, only for /predict) ----
_predictor = None

def _get_predictor():
    global _predictor
    if _predictor is None:
        from dynamic_predictor import DynamicStockPredictor
        _predictor = DynamicStockPredictor()
    return _predictor

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": str(datetime.now())}

@app.get("/predict/{symbol}")
def predict(symbol: str):
    try:
        return _get_predictor().predict_now(symbol.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
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
        ticker = yf.Ticker(resolved)
        hist = ticker.history(period=period, interval=interval)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data found")

        # Compute indicators on full hist
        hist['rsi']         = _rsi(hist['Close'])
        macd_line, macd_sig, macd_hist = _macd(hist['Close'])
        hist['macd_line']   = macd_line
        hist['macd_signal'] = macd_sig
        hist['macd_hist']   = macd_hist
        bb_upper, bb_lower, bb_mid = _bollinger(hist['Close'])
        hist['bb_upper']    = bb_upper
        hist['bb_lower']    = bb_lower
        hist['bb_mid']      = bb_mid

        candles = []
        for date, row in hist.iterrows():
            candles.append({
                "date":        str(date.date()),
                "open":        round(float(row["Open"]), 2),
                "high":        round(float(row["High"]), 2),
                "low":         round(float(row["Low"]), 2),
                "close":       round(float(row["Close"]), 2),
                "volume":      int(row["Volume"]),
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
        import traceback
        print(f"CHART ERROR [{symbol}]: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/portfolio")
def get_portfolio():
    try:
        holdings = [
            {"symbol": "INFY", "qty": 100, "avg_price": 1285.50},
            {"symbol": "RELIANCE", "qty": 25, "avg_price": 2850.00},
            {"symbol": "TCS", "qty": 50, "avg_price": 3850.00},
        ]

        for h in holdings:
            try:
                chart = get_chart(h["symbol"])
                h["ltp"] = chart["latest"]
                h["pnl"] = round((h["ltp"] - h["avg_price"]) * h["qty"], 2)
                h["pnl_pct"] = round((h["pnl"] / (h["avg_price"] * h["qty"])) * 100, 2)
            except Exception:
                h["ltp"] = round(h["avg_price"] * 1.02, 2)
                h["pnl"] = round(h["qty"] * h["avg_price"] * 0.02, 2)
                h["pnl_pct"] = 2.0

        total_invested = sum(h["qty"] * h["avg_price"] for h in holdings)
        total_value = sum(h["qty"] * h["ltp"] for h in holdings)
        total_pnl = sum(h["pnl"] for h in holdings)

        return {
            "holdings": holdings,
            "summary": {
                "total_value": round(total_value, 0),
                "total_pnl": round(total_pnl, 0),
                "total_pnl_pct": round((total_pnl / total_invested) * 100, 2) if total_invested else 0,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

MARKETAUX_KEY = "HsC3kPpxLO2mGwsL68O0oQGVq1DEcfPLVaTGg4lX"

@app.get("/news/{symbol}")
async def get_news(symbol: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.marketaux.com/v1/news/all",
                params={
                    "symbols": symbol.upper(),
                    "filter_entities": "true",
                    "language": "en",
                    "api_token": MARKETAUX_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json().get("data", [])

        articles = []
        for item in data:
            sentiment = item.get("entities", [{}])[0].get("sentiment_score", 0) if item.get("entities") else 0
            if sentiment > 0.15:
                impact = "Bullish"
            elif sentiment < -0.15:
                impact = "Bearish"
            else:
                impact = "Neutral"

            articles.append({
                "title": item.get("title", ""),
                "summary": item.get("description", ""),
                "source": item.get("source", ""),
                "url": item.get("url", ""),
                "image": item.get("image_url", ""),
                "published": item.get("published_at", ""),
                "impact": impact,
                "sentiment_score": round(sentiment, 3),
            })

        return {"symbol": symbol.upper(), "articles": articles}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Marketaux API error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    """
    Return a compact fundamentals snapshot for trader overlay.
    Keep response small and fast.
    """
    try:
        clean = symbol.upper().replace(".NS", "").replace(".BO", "").strip()

        # Temporary mock snapshot; replace with real provider later
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

        result = mock_data.get(clean, {
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
        })

        print(f"Fundamentals request: {symbol} -> {clean}")
        print("Fundamentals response:", result)

        return result
    except Exception as e:
        import traceback
        print("FUNDAMENTALS ERROR")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
