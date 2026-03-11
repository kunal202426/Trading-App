"""
MAIN ORCHESTRATOR: Elite Stock Prediction System
Integrates all 6 layers and runs a full walk-forward backtest.

Usage:
    python main_orchestrator.py

Architecture:
    Layer 1: Point-in-Time Data Pipeline
    Layer 2: 42-Feature Engineering
    Layer 3: Multi-Horizon Models (LSTM, Transformer, GRU, XGBoost)
    Layer 4: Ensemble Fusion + Meta-Labeling
    Layer 5: Drift Detection & Regime Adaptation
    Layer 6: Portfolio Construction, Execution & Risk Management
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

# Import all layers
from layer1_data_pipeline import MarketDataLoader, SurvivourshipBiasFilter
from layer2_feature_engineering import FeatureEngine, z_score_features
from layer3_4_models_ensemble import (
    MultiHorizonPredictor, LabelGenerator, EnsembleFusion
)
from layer5_6_drift_execution import (
    DriftAwareModelRouter, PortfolioConstructor, RiskMonitor,
    SmartOrderRouter, IndianMarketCosts, RiskLimits, Order
)


# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

UNIVERSE = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
]

SECTOR_MAP = {
    'RELIANCE': 'Energy', 'TCS': 'IT', 'HDFC': 'Finance',
    'INFY': 'IT', 'ICICIBANK': 'Finance', 'HDFCBANK': 'Finance',
    'KOTAKBANK': 'Finance', 'LT': 'Industrial',
    'HINDUNILVR': 'FMCG', 'SBIN': 'Finance'
}

TRAIN_START = '2020-01-01'
TRAIN_END   = '2022-12-31'
TEST_START  = '2023-01-01'
TEST_END    = '2023-06-30'


# ─────────────────────────────────────────────
# BACKTEST ENGINE
# ─────────────────────────────────────────────

class BacktestEngine:
    """
    Walk-forward backtest that simulates the full 6-layer pipeline
    operating day by day, as it would in live trading.
    """

    def __init__(self, universe: List[str], initial_capital: float = 10_000_000):
        self.universe = universe
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.positions: Dict[str, float] = {sym: 0.0 for sym in universe}  # shares held
        self.weights: Dict[str, float] = {sym: 0.0 for sym in universe}    # target weights

        # Initialize all layers
        self.data_loader   = MarketDataLoader(universe, TRAIN_START, TEST_END)
        self.surv_filter   = SurvivourshipBiasFilter()
        self.feature_engine = FeatureEngine()
        self.predictor     = MultiHorizonPredictor()
        self.drift_router  = DriftAwareModelRouter()
        self.port_constructor = PortfolioConstructor(RiskLimits())
        self.risk_monitor  = RiskMonitor(RiskLimits())
        self.order_router  = SmartOrderRouter()
        self.cost_model    = IndianMarketCosts()

        # Results tracking
        self.daily_pnl:     List[float] = []
        self.daily_returns: List[float] = []
        self.trade_log:     List[Dict]  = []
        self.signal_history: List[Dict] = []

    # ─── STEP 1: Load and feature-engineer all data ──────────────────

    def prepare_features(self) -> Dict[str, pd.DataFrame]:
        """
        Run Layers 1 & 2: load data and compute all 42 features per symbol.
        """
        print("\n" + "="*60)
        print("LAYER 1: Loading Market Data")
        print("="*60)

        all_ohlcv    = self.data_loader.load_all()
        options_df   = self.data_loader.load_options_data()
        macro_df     = self.data_loader.load_macro_data()

        # Create a synthetic "Nifty" index as market proxy
        nifty_close = pd.Series(
            sum(df['close'].values for df in all_ohlcv.values()) / len(all_ohlcv),
            index=all_ohlcv[self.universe[0]]['date']
        )

        print(f"  ✓ Loaded OHLCV for {len(self.universe)} symbols")
        print(f"  ✓ Date range: {TRAIN_START} → {TEST_END}")
        print(f"  ✓ Options + Macro data loaded")

        print("\n" + "="*60)
        print("LAYER 2: Computing All 42 Features")
        print("="*60)

        feature_store = {}
        for sym in self.universe:
            price_df    = all_ohlcv[sym]
            sentiment_df = self.data_loader.load_news_sentiment(sym)

            master_df = self.feature_engine.compute_full_feature_matrix(
                price_df=price_df,
                options_df=options_df,
                macro_df=macro_df,
                sentiment_df=sentiment_df,
                index_close=nifty_close,
                symbol=sym
            )
            master_df = z_score_features(master_df)
            feature_store[sym] = master_df
            print(f"  ✓ {sym}: {master_df.shape[1]} features over {len(master_df)} days")

        return feature_store

    # ─── STEP 2: Train all horizon models ────────────────────────────

    def train_models(self, feature_store: Dict[str, pd.DataFrame]):
        """Layer 3 + 4: Train models on the training period only."""
        print("\n" + "="*60)
        print("LAYER 3 & 4: Training Multi-Horizon Ensemble")
        print("="*60)

        # Use the first (largest) symbol's features for training
        # In production: train per-symbol or on panel data
        anchor_sym = self.universe[0]
        train_mask = (feature_store[anchor_sym].index >= TRAIN_START) & \
                     (feature_store[anchor_sym].index <= TRAIN_END)
        train_features = feature_store[anchor_sym][train_mask]

        self.predictor.fit(train_features)
        print("\n  ✓ All models trained on training period.")
        print(f"  Validation metrics:")
        for horizon, metrics in self.predictor.val_metrics.items():
            print(f"    {horizon:15s}: accuracy = {metrics['val_accuracy']:.3f}")

    # ─── STEP 3: Walk-forward backtest ───────────────────────────────

    def run_backtest(self, feature_store: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Day-by-day walk-forward simulation over the test period.
        Layers 4, 5, 6 operate in real-time simulation.
        """
        print("\n" + "="*60)
        print("BACKTEST: Walk-Forward Simulation")
        print("="*60)

        # Get test dates
        test_dates = [d for d in feature_store[self.universe[0]].index
                      if TEST_START <= str(d.date()) <= TEST_END]

        print(f"  Test period: {TEST_START} → {TEST_END} ({len(test_dates)} days)")

        portfolio_values = [self.capital]
        dates_list = []
        regime_history = []

        for day_idx, date in enumerate(test_dates):

            # ── Get risk features for today ──────────────────────────
            anchor_feat = feature_store[self.universe[0]]
            if date not in anchor_feat.index:
                continue

            day_feat = anchor_feat.loc[date]
            risk_features = {
                'india_vix':  float(day_feat.get('india_vix', 18)),
                'bas_proxy':  float(day_feat.get('bas_proxy', 0.002)),
                'gpr_index':  float(day_feat.get('gpr_index', 150)),
                'regime':     float(day_feat.get('market_regime', 1) or 1),
                'pcr_index':  float(day_feat.get('pcr_index', 0.9)),
            }
            regime = int(risk_features['regime'])

            # ── Generate signals from each model per symbol ──────────
            all_signals = {}
            all_confidences = {}
            all_vols = {}

            for sym in self.universe:
                if sym not in feature_store:
                    continue
                sym_feat = feature_store[sym]
                # Use lookback window ending at today
                lookback_end = sym_feat.index.get_loc(date) if date in sym_feat.index else None
                if lookback_end is None or lookback_end < 60:
                    continue
                window_df = sym_feat.iloc[max(0, lookback_end-60):lookback_end+1]

                signals_dict = self.predictor.predict_signals(window_df, risk_features)
                decision = self.predictor.get_ensemble_decision(
                    signals_dict, risk_features)

                all_signals[sym] = decision['signal']
                all_confidences[sym] = decision['confidence']
                # Get realized vol from features
                vol_col = 'hvol_20d'
                all_vols[sym] = float(window_df[vol_col].iloc[-1]) \
                    if vol_col in window_df.columns else 0.20

            if not all_signals:
                continue

            # ── Portfolio construction (Layer 6B) ────────────────────
            target_weights = self.port_constructor.build_target_weights(
                signals=all_signals,
                confidences=all_confidences,
                volatilities=all_vols,
                sector_map=SECTOR_MAP,
                regime=regime,
                current_weights=self.weights
            )

            # ── Simulate P&L from position changes ──────────────────
            daily_pnl = 0.0
            for sym in self.universe:
                if sym not in feature_store:
                    continue
                sym_feat = feature_store[sym]
                if date not in sym_feat.index:
                    continue
                idx = sym_feat.index.get_loc(date)
                if idx + 1 >= len(sym_feat):
                    continue

                # Next day return (simulates holding overnight)
                today_close = float(sym_feat.iloc[idx].get('close', 1.0))
                next_close  = float(sym_feat.iloc[idx + 1].get('close', today_close))
                stock_return = (next_close / today_close - 1) if today_close > 0 else 0

                weight = target_weights.get(sym, 0)
                turnover = abs(weight - self.weights.get(sym, 0))
                cost = self.cost_model.total_round_trip_cost() * turnover

                daily_pnl += weight * stock_return - cost

            # ── Risk monitoring (Layer 6D) ────────────────────────────
            risk_status = self.risk_monitor.update_pnl(daily_pnl, str(date.date()))
            self.risk_monitor.reset_daily()

            if risk_status['action'] == 'kill':
                print(f"  🚨 Kill-switch at {date.date()}. Stopping backtest.")
                break
            elif risk_status['action'] == 'reduce':
                # Scale all weights by 50%
                target_weights = {sym: w * 0.5 for sym, w in target_weights.items()}

            # ── Drift detection update (Layer 5) ─────────────────────
            for sym in self.universe[:1]:  # Monitor primary symbol
                if sym in all_signals:
                    self.drift_router.update(
                        horizon='intraday',
                        prediction=int(np.sign(all_signals[sym])),
                        actual=int(np.sign(daily_pnl)),
                        india_vix=risk_features['india_vix'],
                        gpr=risk_features['gpr_index']
                    )

            # ── Update state ─────────────────────────────────────────
            self.weights = target_weights
            self.capital *= (1 + daily_pnl)
            self.daily_returns.append(daily_pnl)
            portfolio_values.append(self.capital)
            dates_list.append(date)
            regime_history.append(regime)

        # ── Build results DataFrame ──────────────────────────────────
        results = pd.DataFrame({
            'date': dates_list,
            'portfolio_value': portfolio_values[1:len(dates_list)+1],
            'daily_return': self.daily_returns[:len(dates_list)],
            'regime': regime_history[:len(dates_list)]
        }).set_index('date')

        return results

    # ─── STEP 4: Performance analytics ──────────────────────────────

    def compute_performance(self, results: pd.DataFrame) -> Dict:
        """Compute comprehensive performance metrics."""
        if len(results) == 0:
            return {}

        r = results['daily_return'].dropna()
        pv = results['portfolio_value']

        sharpe = r.mean() / (r.std() + 1e-10) * np.sqrt(252)
        total_return = (pv.iloc[-1] / self.initial_capital - 1)
        max_dd = ((pv.cummax() - pv) / pv.cummax()).max()
        calmar = (total_return / (max_dd + 1e-10)) if max_dd > 0 else 0
        hit_rate = (r > 0).mean()
        turnover_est = 0.10  # estimated daily turnover

        metrics = {
            'Total Return':       f"{total_return:.2%}",
            'Annualized Sharpe':  f"{sharpe:.3f}",
            'Max Drawdown':       f"{max_dd:.2%}",
            'Calmar Ratio':       f"{calmar:.2f}",
            'Daily Hit Rate':     f"{hit_rate:.2%}",
            'Final Capital (₹)':  f"₹{pv.iloc[-1]:,.0f}",
            'VaR (95%)':          f"{self.risk_monitor.compute_var():.2%}",
            'Drift Events':       self.drift_router.drift_detectors.get(
                                      'intraday', type('', (), {'drift_count': 0})()
                                  ).drift_count if 'intraday' in self.drift_router.drift_detectors
                                  else 0,
        }
        return metrics

    def print_results(self, metrics: Dict, results: pd.DataFrame):
        """Print a formatted performance summary."""
        print("\n" + "="*60)
        print("BACKTEST RESULTS SUMMARY")
        print("="*60)

        for k, v in metrics.items():
            print(f"  {k:<25s}: {v}")

        print("\n  Regime Distribution:")
        regime_labels = {0: 'Calm', 1: 'Elevated', 2: 'Crisis'}
        rc = results['regime'].value_counts(normalize=True)
        for r_id, frac in rc.items():
            if pd.isna(r_id):
                continue
            try:
                label = regime_labels.get(int(float(r_id)), 'Unknown')
            except (ValueError, TypeError):
                label = 'Unknown'
            print(f"    {label:<10s}: {frac:.1%}")

        print("\n  Model Validation Summary:")
        for horizon, m in self.predictor.val_metrics.items():
            print(f"    {horizon:<15s}: val_accuracy = {m['val_accuracy']:.3f}")

        print("\n" + "="*60)
        print("System Status: All 6 Layers operational")
        print("="*60)


# ─────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────

def main():
    print("\n" + "█"*60)
    print("  ELITE STOCK PREDICTION SYSTEM v2.1")
    print("  Indian Markets (NSE/BSE) | 42-Feature Ensemble")
    print("  Blueprint: 6-Layer Hierarchical Architecture")
    print("█"*60)

    engine = BacktestEngine(universe=UNIVERSE, initial_capital=10_000_000)

    # Layer 1 + 2: Load and engineer features
    feature_store = engine.prepare_features()

    # Layer 3 + 4: Train multi-horizon ensemble
    engine.train_models(feature_store)

    # Layer 5 + 6: Walk-forward backtest
    results = engine.run_backtest(feature_store)

    # Performance analytics
    metrics = engine.compute_performance(results)
    engine.print_results(metrics, results)

    # Save results
    results.to_csv('backtest_results.csv')
    
    print("\n  ✓ Results saved to backtest_results.csv")

    return results, metrics


if __name__ == '__main__':
    results, metrics = main()
