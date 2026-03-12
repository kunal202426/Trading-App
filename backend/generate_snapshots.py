"""
Generate prediction_snapshots.json for deployment fallback.
Run once locally before pushing to Render:

    cd backend && python generate_snapshots.py

Fetches real prices + computes real technical indicators.
Signals are derived from RSI/MACD so they look data-driven, not random.
"""
import os, sys, json, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import pandas as pd
from alpha_vantage import get_daily_ohlcv, get_quote, user_symbol_to_av

SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK",
           "ICICIBANK", "COASTCORP", "WANBURY", "526071"]

HORIZON_DAYS   = {'ultra_short': 0.1, 'short': 0.5, 'intraday': 1.0, 'swing': 5.0, 'positional': 60.0}
HORIZON_LABELS = {'ultra_short': '~45 mins', 'short': '~3 hours',
                  'intraday': '1 day', 'swing': '1 week', 'positional': '2 months'}


def _rsi(close, n=14):
    delta = close.diff()
    gain  = delta.clip(lower=0).ewm(com=n - 1, min_periods=n).mean()
    loss  = (-delta.clip(upper=0)).ewm(com=n - 1, min_periods=n).mean()
    return (100 - 100 / (1 + gain / loss)).iloc[-1]


def _macd(close, fast=12, slow=26, sig=9):
    ema_f = close.ewm(span=fast, adjust=False).mean()
    ema_s = close.ewm(span=slow, adjust=False).mean()
    line  = ema_f - ema_s
    signal = line.ewm(span=sig, adjust=False).mean()
    return round(float(line.iloc[-1]), 3), round(float(signal.iloc[-1]), 3), round(float((line - signal).iloc[-1]), 3)


def _bb(close, n=20):
    mid = close.rolling(n).mean()
    std = close.rolling(n).std()
    upper, lower = mid + 2*std, mid - 2*std
    pct_b = ((close - lower) / (upper - lower + 1e-10)).iloc[-1]
    bw    = ((upper - lower) / (mid + 1e-10)).iloc[-1]
    return round(float(pct_b), 3), round(float(bw), 3)


def _signal_from_indicators(rsi, macd_hist, pct_b):
    """Derive a simple directional signal from RSI + MACD + BB."""
    score = 0
    if rsi < 40:   score += 1
    elif rsi > 60: score -= 1
    if macd_hist > 0: score += 1
    elif macd_hist < 0: score -= 1
    if pct_b < 0.3:  score += 1
    elif pct_b > 0.7: score -= 1
    if score >= 2:   return  1
    if score <= -2:  return -1
    return 0


snapshots = {}

for sym in SYMBOLS:
    av_sym = user_symbol_to_av(sym)
    print(f"\nProcessing {sym} ({av_sym})...")
    try:
        # ── fetch ~6 months of daily data ──────────────────────────────
        start = (datetime.date.today() - datetime.timedelta(days=180)).strftime("%Y-%m-%d")
        hist  = get_daily_ohlcv(av_sym, start_date=start)

        if hist.empty or len(hist) < 30:
            print(f"  ✗ Not enough data ({len(hist)} rows)")
            continue

        close  = hist['close']
        high   = hist['high']
        low    = hist['low']
        volume = hist['volume']

        # ── live price via quote ────────────────────────────────────────
        try:
            q = get_quote(av_sym)
            price = q['price']
        except Exception:
            price = float(close.iloc[-1])

        # ── indicators ─────────────────────────────────────────────────
        rsi_val              = round(float(_rsi(close)), 1)
        macd_l, macd_s, macd_h = _macd(close)
        pct_b, bw            = _bb(close)

        log_ret   = np.log(close / close.shift(1)).dropna()
        daily_vol = float(log_ret.std())
        daily_vol = max(0.005, min(daily_vol, 0.08))

        # OBV z-score
        obv       = (np.sign(close.diff()) * volume).cumsum()
        obv_z     = round(float((obv - obv.rolling(20).mean()) / (obv.rolling(20).std() + 1e-10)).iloc[-1], 2)

        # MFI (14-period)
        tp  = (high + low + close) / 3
        mf  = tp * volume
        pos = mf.where(tp > tp.shift(1), 0).rolling(14).sum()
        neg = mf.where(tp < tp.shift(1), 0).rolling(14).sum()
        mfi_val = round(float(100 - 100 / (1 + pos / (neg + 1e-10))).iloc[-1], 1)

        # ATR
        tr    = pd.concat([high - low, (high - close.shift()).abs(), (low - close.shift()).abs()], axis=1).max(axis=1)
        atr   = round(float(tr.rolling(14).mean().iloc[-1]), 2)

        # ADX (simplified)
        dm_p  = (high.diff()).clip(lower=0)
        dm_m  = (-low.diff()).clip(lower=0)
        tr14  = tr.ewm(span=14, adjust=False).mean()
        di_p  = 100 * dm_p.ewm(span=14, adjust=False).mean() / (tr14 + 1e-10)
        di_m  = 100 * dm_m.ewm(span=14, adjust=False).mean() / (tr14 + 1e-10)
        dx    = 100 * (di_p - di_m).abs() / (di_p + di_m + 1e-10)
        adx_val = round(float(dx.ewm(span=14, adjust=False).mean().iloc[-1]), 1)

        # Momentum
        mom20 = round(float((close / close.shift(20) - 1).iloc[-1]), 4) if len(close) > 20 else 0.0
        mom50 = round(float((close / close.shift(50) - 1).iloc[-1]), 4) if len(close) > 50 else 0.0

        signal = _signal_from_indicators(rsi_val, macd_h, pct_b)
        conf   = round(min(0.45 + abs(rsi_val - 50) / 100 + abs(pct_b - 0.5), 0.78), 2)

        # ── build horizon signals ───────────────────────────────────────
        horizon_signals = {}
        for h, days in HORIZON_DAYS.items():
            sig  = signal if h in ('intraday', 'swing', 'short') else (signal if days < 2 else 0)
            move = sig * daily_vol * (days ** 0.5)
            tgt  = round(price * (1 + move), 2)
            stp  = round(price * (1 - sig * daily_vol * 0.5), 2) if sig != 0 else None
            horizon_signals[h] = {
                'signal':        sig,
                'confidence':    round(conf * (0.85 + 0.15 * (1 - days / 60)), 2),
                'target_price':  tgt if sig != 0 else price,
                'stop_loss':     stp,
                'horizon_label': HORIZON_LABELS[h],
            }

        snapshots[sym] = {
            'symbol':               sym,
            'signal':               signal,
            'confidence':           conf,
            'regime':               'Trending' if adx_val > 25 else 'Ranging',
            'horizon_signals':      horizon_signals,
            'last_price':           round(price, 2),
            'timestamp':            str(datetime.date.today()),
            'primary_target':       horizon_signals['intraday']['target_price'],
            'primary_stop':         horizon_signals['intraday']['stop_loss'],
            'primary_horizon_label': '1 day',
            '_snapshot':            True,
            '_snapshot_date':       str(datetime.date.today()),
            'indicators': {
                'rsi':          rsi_val,
                'macd':         macd_l,
                'macd_signal':  macd_s,
                'macd_hist':    macd_h,
                'bb_pct_b':     pct_b,
                'bb_bandwidth': bw,
                'obv_zscore':   obv_z,
                'mfi':          mfi_val,
                'atr':          atr,
                'adx':          adx_val,
                'hvol_20d':     round(daily_vol, 4),
                'india_vix':    16.5,
                'pcr_index':    1.0,
                'momentum_20':  mom20,
                'momentum_50':  mom50,
                'regime_score': round(adx_val / 100, 2),
                'fear_greed':   round(50 + (rsi_val - 50) * 0.6, 1),
            },
        }
        print(f"  ✓ price={price:.2f}  rsi={rsi_val}  signal={signal}  conf={conf}")

    except Exception as e:
        print(f"  ✗ {sym}: {e}")

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prediction_snapshots.json')
with open(out, 'w') as f:
    json.dump(snapshots, f, indent=2)
print(f"\nSaved {len(snapshots)} snapshots → {out}")
