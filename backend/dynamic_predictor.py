"""
DynamicStockPredictor
=====================
End-to-end wrapper: download NSE data → feature engineering → train/cache
horizon models → produce a live prediction dict for any symbol.
"""

import os
import pickle
import datetime
import numpy as np
import pandas as pd
from typing import Dict, List
from alpha_vantage import user_symbol_to_av, get_daily_ohlcv, get_quote

from layer1_data_pipeline import MarketDataLoader
from layer2_feature_engineering import FeatureEngine, z_score_features
from layer3_4_models_ensemble import MultiHorizonPredictor
from layer5_6_drift_execution import RegimeDetector

MODEL_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "model_cache")


class DynamicStockPredictor:
    """Download data, build features, train models, and predict for any NSE symbol."""

    def __init__(self):
        self.feature_engine = FeatureEngine()
        self.regime_detector = RegimeDetector()
        self._predictors: Dict[str, MultiHorizonPredictor] = {}
        self._feature_store: Dict[str, pd.DataFrame] = {}
        self._raw_feature_store: Dict[str, pd.DataFrame] = {}
        os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

    def _resolve_symbol(self, symbol: str) -> str:
        """Resolve a user-facing symbol to an Alpha Vantage ticker (e.g. NSE:INFY)."""
        return user_symbol_to_av(symbol)

    # ──────────────────────────────────────────────
    # 1. load_or_train
    # ──────────────────────────────────────────────

    def load_or_train(self, symbol: str) -> pd.DataFrame:
        """
        Download last 3 years of NSE data for *symbol*, run it through
        Layer 1 + Layer 2, train all 5 horizon models on 80 % of the data,
        and cache the trained predictor to disk.  If a cached model already
        exists the training step is skipped.

        Returns the full feature DataFrame for *symbol*.
        """
        # Return early if already loaded this session
        if symbol in self._feature_store and symbol in self._predictors and symbol in self._raw_feature_store:
            return self._feature_store[symbol]

        # ── Layer 1: fetch data ──────────────────────────────────────
        end_date = datetime.date.today().strftime("%Y-%m-%d")
        start_date = (datetime.date.today()
                      - datetime.timedelta(days=3 * 365)).strftime("%Y-%m-%d")

        av_ticker = self._resolve_symbol(symbol)
        print(f"  Downloading {symbol} ({av_ticker}) via Alpha Vantage...")

        raw = get_daily_ohlcv(av_ticker, start_date=start_date, end_date=end_date)

        if raw is None or raw.empty:
            raise ValueError(
                f"Could not download data for {av_ticker} (resolved from {symbol})."
            )
        print(f"  Downloaded {len(raw)} rows for {av_ticker} ({start_date} → {end_date})")

        # raw already has lowercase columns: date, open, high, low, close, volume, adjusted_close
        price_df = raw.copy()
        price_df['symbol'] = symbol
        price_df = price_df.dropna().reset_index(drop=True)

        loader = MarketDataLoader(
            universe=[symbol], start_date=start_date, end_date=end_date,
        )
        options_df = loader.load_options_data()
        macro_df = loader.load_macro_data()
        sentiment_df = loader.load_news_sentiment(symbol)

        nifty_proxy = pd.Series(
            price_df["close"].values,
            index=price_df["date"],
        )

        # ── Layer 2: feature engineering ─────────────────────────────
        master_df = self.feature_engine.compute_full_feature_matrix(
            price_df=price_df,
            options_df=options_df,
            macro_df=macro_df,
            sentiment_df=sentiment_df,
            index_close=nifty_proxy,
            symbol=symbol,
        )
        self._raw_feature_store[symbol] = master_df.copy()
        master_df = z_score_features(master_df)
        self._feature_store[symbol] = master_df

        # ── Layer 3-4: try to load cached model, else train ─────────
        pkl_path = os.path.join(MODEL_CACHE_DIR, f"{symbol}_model.pkl")

        if os.path.exists(pkl_path):
            with open(pkl_path, "rb") as f:
                self._predictors[symbol] = pickle.load(f)
            print(f"  Loaded cached model for {symbol} from {pkl_path}")
        else:
            predictor = MultiHorizonPredictor()
            # Train on first 80 % of data
            n_train = int(len(master_df) * 0.80)
            train_df = master_df.iloc[:n_train]
            predictor.fit(train_df)

            # Persist
            with open(pkl_path, "wb") as f:
                pickle.dump(predictor, f)
            print(f"  Saved trained model for {symbol} to {pkl_path}")
            self._predictors[symbol] = predictor

        return master_df

    # ──────────────────────────────────────────────
    # 2. predict_now
    # ──────────────────────────────────────────────

    def predict_now(self, symbol: str) -> dict:
        """
        Produce a prediction dict for *symbol* using the most recent day
        of features.
        """
        master_df = self.load_or_train(symbol)
        predictor = self._predictors[symbol]

        # Last row's raw values for risk features
        last_row = master_df.iloc[-1]
        risk_features = {
            "india_vix": float(last_row.get("india_vix", 18) or 18),
            "bas_proxy": float(last_row.get("bas_proxy", 0.002) or 0.002),
            "gpr_index": float(last_row.get("gpr_index", 150) or 150),
            "regime": float(last_row.get("market_regime", 1) or 1),
            "pcr_index": float(last_row.get("pcr_index", 0.9) or 0.9),
        }

        # Use a lookback window (last 60 rows) for sequence models
        window_df = master_df.iloc[-60:]

        signals = predictor.predict_signals(window_df, risk_features)
        decision = predictor.get_ensemble_decision(signals, risk_features)

        # Regime label
        regime_int = int(risk_features["regime"])
        regime_label = self.regime_detector.regime_label(regime_int)

        # Build per-horizon sub-dict
        horizon_signals = {}
        for h_name in ["ultra_short", "short", "intraday", "swing",
                        "positional"]:
            if h_name in signals:
                horizon_signals[h_name] = {
                    "signal": int(signals[h_name].signal),
                    "confidence": round(float(signals[h_name].confidence), 2),
                }
            else:
                horizon_signals[h_name] = {"signal": 0, "confidence": 0.0}

        # Final consolidated signal: map float to int direction
        raw_sig = decision["signal"]
        if raw_sig > 0:
            final_signal = 1
        elif raw_sig < 0:
            final_signal = -1
        else:
            final_signal = 0

        # ── Live price via Alpha Vantage GLOBAL_QUOTE ─────────────────
        av_sym = self._resolve_symbol(symbol)
        try:
            quote = get_quote(av_sym)
            last_price = round(quote["price"], 2)
        except Exception:
            last_price = 0.0

        timestamp = str(master_df.index[-1].date()
                        if hasattr(master_df.index[-1], "date")
                        else master_df.index[-1])

        # ── 60-day volatility for price targets ───────────────────────
        raw_hist = None
        try:
            sixty_days_ago = (datetime.date.today()
                              - datetime.timedelta(days=90)).strftime("%Y-%m-%d")
            raw_hist = get_daily_ohlcv(av_sym, start_date=sixty_days_ago)
            if not raw_hist.empty and len(raw_hist) > 5:
                log_returns = np.log(raw_hist['close'] / raw_hist['close'].shift(1)).dropna()
                daily_vol = float(log_returns.std())
                daily_vol = max(0.005, min(daily_vol, 0.08))
            else:
                daily_vol = 0.015
        except Exception:
            daily_vol = 0.015

        HORIZON_DAYS = {
            'ultra_short': 0.1,
            'short':       0.5,
            'intraday':    1.0,
            'swing':       5.0,
            'positional':  60.0,
        }
        HORIZON_LABELS = {
            'ultra_short': '~45 mins',
            'short':       '~3 hours',
            'intraday':    '1 day',
            'swing':       '1 week',
            'positional':  '2 months',
        }

        for h in horizon_signals:
            sig = horizon_signals[h]['signal']
            days = HORIZON_DAYS[h]
            move = sig * daily_vol * (days ** 0.5)
            target = round(last_price * (1 + move), 2)
            stop = round(last_price * (1 - sig * daily_vol * 0.5), 2)
            horizon_signals[h]['target_price'] = target if sig != 0 else last_price
            horizon_signals[h]['stop_loss'] = stop if sig != 0 else None
            horizon_signals[h]['horizon_label'] = HORIZON_LABELS[h]

        result = {
            "symbol": symbol,
            "signal": final_signal,
            "confidence": round(float(decision["confidence"]), 2),
            "regime": regime_label.title(),
            "horizon_signals": horizon_signals,
            "last_price": round(last_price, 2),
            "timestamp": timestamp,
        }

        # ── Primary target: pick best matching horizon ────────────
        primary_horizon = 'intraday'
        for h in ['intraday', 'short', 'ultra_short', 'swing', 'positional']:
            if h in result['horizon_signals']:
                hs = result['horizon_signals'][h]
                if hs['signal'] != 0 and hs['signal'] == result['signal']:
                    primary_horizon = h
                    break
        result['primary_target'] = result['horizon_signals'][primary_horizon]['target_price']
        result['primary_stop']   = result['horizon_signals'][primary_horizon]['stop_loss']
        result['primary_horizon_label'] = result['horizon_signals'][primary_horizon]['horizon_label']

        # ── Key indicators from RAW (pre-scaled) feature matrix ───────
        raw_df = self._raw_feature_store[symbol]
        raw_row = raw_df.iloc[-1]

        def safe(col, default=0, decimals=2):
            """Extract a raw indicator value, returning *default* on NaN/missing."""
            v = raw_row.get(col, default)
            if v is None or (isinstance(v, float) and np.isnan(v)):
                return round(float(default), decimals)
            return round(float(v), decimals)

        result['indicators'] = {
            'rsi':          safe('rsi', 50, 1),
            'macd':         safe('macd_line', 0, 3),
            'macd_signal':  safe('macd_signal', 0, 3),
            'macd_hist':    safe('macd_hist', 0, 3),
            'bb_pct_b':     safe('bb_pct_b', 0.5, 3),
            'bb_bandwidth': safe('bb_bandwidth', 0, 3),
            'obv_zscore':   safe('obv_zscore', 0, 2),
            'mfi':          safe('mfi', 50, 1),
            'atr':          round(safe('atr', safe('atr_14', safe('average_true_range', 0))), 2),
            'adx':          safe('adx', 25, 1),
            'hvol_20d':     safe('hvol_20d', 0, 4),
            'india_vix':    safe('india_vix', 15, 1),
            'pcr_index':    safe('pcr_index', 1, 2),
            'momentum_20':  safe('mom_20', 0, 4),
            'momentum_50':  safe('mom_50', 0, 4),
            'regime_score': safe('stress_score', 0, 2),
            'fear_greed':   safe('fear_greed', 50, 1),
        }

        # ── ATR manual fallback if still 0 ──
        def get_series(df, *names):
            for name in names:
                if name in df.columns:
                    return df[name]
            return None

        print("ATR fallback columns:", list(raw_df.columns)[-20:])

        # Prefer raw_hist (original OHLCV, lowercase columns from Alpha Vantage)
        _atr_df = raw_hist if (raw_hist is not None and not raw_hist.empty) else raw_df

        high_s  = get_series(_atr_df, 'High', 'high')
        low_s   = get_series(_atr_df, 'Low', 'low')
        close_s = get_series(_atr_df, 'Close', 'close')

        atr_value = round(safe('atr', safe('atr_14', safe('average_true_range', 0))), 2)

        if atr_value == 0 and high_s is not None and low_s is not None and close_s is not None and len(close_s) >= 2:
            high = float(high_s.iloc[-1])
            low = float(low_s.iloc[-1])
            prev_close = float(close_s.iloc[-2])
            atr_value = round(max(high - low, abs(high - prev_close), abs(low - prev_close)), 2)

        result['indicators']['atr'] = atr_value

        return result

    # ──────────────────────────────────────────────
    # 3. batch_predict
    # ──────────────────────────────────────────────

    def batch_predict(self, symbols: List[str]) -> list:
        """Run predict_now() for every symbol and return list of dicts."""
        results = []
        for sym in symbols:
            try:
                results.append(self.predict_now(sym))
            except Exception as e:
                print(f"  Error predicting {sym}: {e}")
        return results


if __name__ == "__main__":
    predictor = DynamicStockPredictor()
    result = predictor.predict_now("TATAMOTORS")
    print(result)
