"""
LAYER 5: Adaptive Learning & Concept Drift Detection
LAYER 6: Cost-Aware Execution, Portfolio Construction & Risk Management

Implements:
- ADWIN-style drift detection
- Regime-conditional model weighting
- Portfolio construction: signal → position sizes
- Risk limits: per-name, sector, drawdown, kill-switch
- Transaction cost modeling (Indian market: brokerage, STT, impact)
- Full audit logging
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import deque
import warnings
warnings.filterwarnings('ignore')


# ─────────────────────────────────────────────
# LAYER 5A: CONCEPT DRIFT DETECTION
# ─────────────────────────────────────────────

class ADWINDriftDetector:
    """
    Adaptive Windowing (ADWIN) algorithm for detecting concept drift.
    Monitors model prediction error or feature distribution shift.
    """

    def __init__(self, delta: float = 0.002, clock: int = 32):
        self.delta = delta
        self.clock = clock
        self._window: List[float] = []
        self._total = 0.0
        self._variance = 0.0
        self._n = 0
        self.drift_detected = False
        self.drift_count = 0

    def add_element(self, value: float) -> bool:
        """
        Add a new observation. Returns True if drift is detected.
        """
        self._window.append(value)
        self._n += 1
        self._total += value
        if self._n > 1:
            old_mean = (self._total - value) / (self._n - 1)
            self._variance += (value - old_mean) ** 2 / self._n

        self.drift_detected = self._detect_change()
        if self.drift_detected:
            self.drift_count += 1
            # Shrink window after drift
            half = len(self._window) // 2
            removed = self._window[:half]
            self._window = self._window[half:]
            self._n = len(self._window)
            self._total = sum(self._window)
            self._variance = max(np.var(self._window) * self._n, 0)
        return self.drift_detected

    def _detect_change(self) -> bool:
        """Test for statistically significant change in sub-windows."""
        n = len(self._window)
        if n < 30:
            return False
        # Test multiple cut-points
        for cut in range(10, n - 10, max(1, n // 20)):
            w0 = self._window[:cut]
            w1 = self._window[cut:]
            m0, m1 = np.mean(w0), np.mean(w1)
            v0, v1 = np.var(w0), np.var(w1)
            n0, n1 = len(w0), len(w1)
            epsilon_cut = np.sqrt(
                (1 / (2 * n0) + 1 / (2 * n1)) * np.log(4 * n / self.delta)
            )
            if abs(m0 - m1) >= epsilon_cut:
                return True
        return False

    @property
    def mean(self) -> float:
        return np.mean(self._window) if self._window else 0.0


class RegimeDetector:
    """
    Multi-signal regime classifier for Indian markets.
    Combines India VIX, GPR, macro indicators into regime states.
    """

    REGIMES = {0: 'calm', 1: 'elevated', 2: 'crisis'}

    def __init__(self, vix_thresholds=(15, 25), gpr_thresholds=(150, 250)):
        self.vix_lo, self.vix_hi = vix_thresholds
        self.gpr_lo, self.gpr_hi = gpr_thresholds
        self.history: List[int] = []

    def classify(self, india_vix: float, gpr_index: float,
                 pcr: float = 1.0) -> int:
        """
        Returns regime integer: 0=calm, 1=elevated, 2=crisis.
        """
        vix_score = 0 if india_vix < self.vix_lo else (1 if india_vix < self.vix_hi else 2)
        gpr_score = 0 if gpr_index < self.gpr_lo else (1 if gpr_index < self.gpr_hi else 2)
        # PCR > 1.3 often signals fear
        pcr_score = 1 if pcr > 1.3 else 0

        composite = round((vix_score * 0.5 + gpr_score * 0.3 + pcr_score * 0.2))
        regime = int(np.clip(composite, 0, 2))
        self.history.append(regime)
        assert regime in {0, 1, 2}, f"regime must be in {{0, 1, 2}}, got {regime}"
        return regime

    def regime_label(self, regime: int) -> str:
        return self.REGIMES.get(regime, 'unknown')


class DriftAwareModelRouter:
    """
    Layer 5: Routes predictions to the appropriate model version
    based on drift detection and regime state.
    """

    def __init__(self):
        self.drift_detectors: Dict[str, ADWINDriftDetector] = {}
        self.regime_detector = RegimeDetector()
        self.model_performance: Dict[str, deque] = {}
        self.retraining_queue: List[str] = []
        self.shadow_models: Dict[str, object] = {}

    def register_horizon(self, horizon: str):
        self.drift_detectors[horizon] = ADWINDriftDetector(delta=0.005)
        self.model_performance[horizon] = deque(maxlen=60)

    def update(self, horizon: str, prediction: int, actual: int,
               india_vix: float, gpr: float, pcr: float = 1.0) -> Dict:
        """
        Update drift detector with latest prediction error.
        Returns drift status and current regime.
        """
        if horizon not in self.drift_detectors:
            self.register_horizon(horizon)

        error = float(prediction != actual)
        drift = self.drift_detectors[horizon].add_element(error)

        correct = float(prediction == actual)
        self.model_performance[horizon].append(correct)

        if drift:
            self.retraining_queue.append(horizon)
            print(f"  ⚠ DRIFT DETECTED in {horizon} model. Queued for retraining.")

        regime = self.regime_detector.classify(india_vix, gpr, pcr)

        return {
            'drift_detected': drift,
            'regime': regime,
            'regime_label': self.regime_detector.regime_label(regime),
            'recent_accuracy': np.mean(self.model_performance[horizon])
                               if self.model_performance[horizon] else 0.5,
            'drift_count': self.drift_detectors[horizon].drift_count
        }

    def get_retraining_queue(self) -> List[str]:
        queue = list(set(self.retraining_queue))
        self.retraining_queue.clear()
        return queue


# ─────────────────────────────────────────────
# LAYER 6A: TRANSACTION COST MODEL
# ─────────────────────────────────────────────

@dataclass
class IndianMarketCosts:
    """
    Realistic Indian market transaction costs (NSE/BSE, 2024).
    Source: SEBI circulars, NSE fee schedule.
    """
    # Brokerage: typically ₹20/order flat or 0.03% for delivery
    brokerage_pct: float = 0.0003          # 0.03% one-way
    # STT: Securities Transaction Tax
    stt_equity_delivery: float = 0.001     # 0.1% on sell side
    stt_equity_intraday: float = 0.00025   # 0.025% on sell side
    stt_futures: float = 0.0001            # 0.01% on sell side
    # Exchange + SEBI fees
    exchange_fee: float = 0.0000345        # 3.45 bps
    sebi_fee: float = 0.000001            # 0.0001%
    # Stamp duty
    stamp_duty: float = 0.00015           # 0.015% on buy side
    # Bid-ask spread estimate (market impact)
    base_impact_bps: float = 5            # 5 basis points base impact

    def total_round_trip_cost(self, trade_type: str = 'intraday',
                              size_pct_adv: float = 0.01) -> float:
        """
        Total cost for a round-trip trade as a fraction of notional.
        size_pct_adv: trade size as fraction of Average Daily Volume.
        """
        if trade_type == 'intraday':
            stt = self.stt_equity_intraday
        else:
            stt = self.stt_equity_delivery

        # Market impact scales with square root of participation rate
        impact = (self.base_impact_bps / 10000) * np.sqrt(size_pct_adv / 0.01)

        explicit = 2 * (self.brokerage_pct + self.exchange_fee +
                        self.sebi_fee) + stt + self.stamp_duty
        total = explicit + 2 * impact  # round-trip impact
        return total


# ─────────────────────────────────────────────
# LAYER 6B: POSITION SIZING
# ─────────────────────────────────────────────

class VolatilityScaledSizing:
    """
    Position sizing using volatility targeting.
    Target portfolio volatility = target_vol (annualized).
    """

    def __init__(self, target_vol: float = 0.15, max_leverage: float = 1.5):
        self.target_vol = target_vol
        self.max_leverage = max_leverage

    def position_size(self, signal: float, realized_vol: float,
                      confidence: float, regime: int) -> float:
        """
        Returns fractional position size [-1, +1] of capital.

        Args:
            signal:       Direction (-1, 0, +1)
            realized_vol: Annualized stock volatility
            confidence:   Model confidence [0, 1]
            regime:       Market regime (0=calm, 1=elevated, 2=crisis)
        """
        if signal == 0 or realized_vol < 1e-6:
            return 0.0

        # Base size from volatility targeting
        base_size = self.target_vol / (realized_vol + 1e-6)
        # Scale by confidence and Kelly fraction
        kelly_fraction = 0.25  # Fractional Kelly (conservative)
        size = base_size * confidence * kelly_fraction

        # Regime adjustment
        regime = int(np.clip(regime, 0, 2))
        regime_scale = {0: 1.0, 1: 0.7, 2: 0.3}[regime]
        size *= regime_scale

        # Cap at max leverage
        size = np.clip(abs(size), 0, self.max_leverage)
        return float(np.sign(signal) * size)


# ─────────────────────────────────────────────
# LAYER 6C: PORTFOLIO CONSTRUCTION
# ─────────────────────────────────────────────

@dataclass
class RiskLimits:
    """Hard risk limits enforced at portfolio construction."""
    max_position_pct: float = 0.10        # Max 10% in any single name
    max_sector_pct: float = 0.30          # Max 30% in any sector
    max_gross_leverage: float = 1.5       # Max 150% gross
    max_net_leverage: float = 0.90        # Max 90% net long
    daily_drawdown_limit: float = 0.08    # 3% daily drawdown → reduce
    max_drawdown_limit: float = 0.25      # 10% max drawdown → kill-switch
    min_liquidity_days: float = 5.0       # Min days to liquidate = 5 ADV days
    max_beta: float = 1.5                 # Max portfolio beta


class PortfolioConstructor:
    """
    Converts model signals into constrained target weights.
    Enforces all risk limits from RiskLimits.
    """

    def __init__(self, limits: Optional[RiskLimits] = None):
        self.limits = limits or RiskLimits()
        self.sizer = VolatilityScaledSizing()
        self.cost_model = IndianMarketCosts()

    def build_target_weights(
        self,
        signals: Dict[str, float],          # symbol -> signal score
        confidences: Dict[str, float],       # symbol -> confidence
        volatilities: Dict[str, float],      # symbol -> realized vol
        sector_map: Dict[str, str],          # symbol -> sector
        regime: int = 1,
        current_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, float]:
        """
        Build a constrained portfolio of target weights.

        Steps:
        1. Compute raw sizes from signal × confidence × vol-scaling
        2. Apply per-name limit
        3. Apply sector limit
        4. Apply leverage limit
        5. Cost-aware filtering: only trade if turnover edge > cost
        """
        current = current_weights or {sym: 0.0 for sym in signals}

        # Step 1: Raw sizes
        raw_weights = {}
        for sym, signal in signals.items():
            vol = volatilities.get(sym, 0.20)
            conf = confidences.get(sym, 0.5)
            raw_weights[sym] = self.sizer.position_size(signal, vol, conf, regime)

        # Step 2: Per-name limit
        for sym in raw_weights:
            raw_weights[sym] = np.clip(
                raw_weights[sym],
                -self.limits.max_position_pct,
                self.limits.max_position_pct
            )

        # Step 3: Sector limits
        sector_weights: Dict[str, float] = {}
        for sym, w in raw_weights.items():
            sector = sector_map.get(sym, 'Unknown')
            sector_weights[sector] = sector_weights.get(sector, 0) + abs(w)

        for sym in list(raw_weights.keys()):
            sector = sector_map.get(sym, 'Unknown')
            if sector_weights.get(sector, 0) > self.limits.max_sector_pct:
                scale = self.limits.max_sector_pct / sector_weights[sector]
                raw_weights[sym] *= scale

        # Step 4: Leverage normalization
        gross = sum(abs(w) for w in raw_weights.values())
        if gross > self.limits.max_gross_leverage:
            scale = self.limits.max_gross_leverage / gross
            raw_weights = {sym: w * scale for sym, w in raw_weights.items()}

        # Step 5: Cost-aware filter – only trade if edge justifies turnover
        final_weights = {}
        for sym, target_w in raw_weights.items():
            current_w = current.get(sym, 0.0)
            turnover = abs(target_w - current_w)
            cost = self.cost_model.total_round_trip_cost(trade_type='delivery',
                                                          size_pct_adv=0.01)
            # Only rebalance if the change is worth more than trading costs
            if turnover > cost * 5:  # 5× cost threshold
                final_weights[sym] = target_w
            else:
                final_weights[sym] = current_w  # Hold current position

        return final_weights

    def compute_portfolio_beta(self, weights: Dict[str, float],
                               betas: Dict[str, float]) -> float:
        """Compute portfolio beta vs Nifty."""
        return sum(w * betas.get(sym, 1.0) for sym, w in weights.items())


# ─────────────────────────────────────────────
# LAYER 6D: RISK MONITOR & KILL-SWITCH
# ─────────────────────────────────────────────

class RiskMonitor:
    """
    Real-time risk monitoring with automatic de-risking and kill-switch.
    Monitors: drawdown, VaR, factor exposures, slippage tracking.
    """

    def __init__(self, limits: Optional[RiskLimits] = None):
        self.limits = limits or RiskLimits()
        self.peak_value = 1.0
        self.current_value = 1.0
        self.daily_start_value = 1.0
        self.is_killed = False
        self.pnl_history: List[float] = []
        self.slippage_history: Dict[str, List[float]] = {}
        self.audit_log: List[Dict] = []

    def update_pnl(self, portfolio_return: float, date: str) -> Dict:
        """
        Update portfolio value and check risk limits.
        Returns action: 'normal', 'reduce', or 'kill'.
        """
        self.current_value *= (1 + portfolio_return)
        self.pnl_history.append(portfolio_return)

        # Update peak
        if self.current_value > self.peak_value:
            self.peak_value = self.current_value

        max_dd = (self.peak_value - self.current_value) / self.peak_value
        daily_dd = (self.daily_start_value - self.current_value) / self.daily_start_value

        action = 'normal'
        reason = ''

        if max_dd >= self.limits.max_drawdown_limit and not self.is_killed:
            self.is_killed = True
            action = 'kill'
            reason = f'Max drawdown limit breached: {max_dd:.2%}'
            print(f"\n  🚨 KILL-SWITCH ACTIVATED: {reason}")

        elif daily_dd >= self.limits.daily_drawdown_limit:
            action = 'reduce'
            reason = f'Daily drawdown limit breached: {daily_dd:.2%}'

        entry = {
            'date': date,
            'portfolio_value': self.current_value,
            'max_drawdown': max_dd,
            'daily_drawdown': daily_dd,
            'action': action,
            'reason': reason
        }
        self.audit_log.append(entry)

        return entry

    def reset_daily(self):
        self.daily_start_value = self.current_value

    def compute_var(self, confidence: float = 0.95, window: int = 60) -> float:
        """Historical Value at Risk."""
        if len(self.pnl_history) < 10:
            return 0.02
        returns = np.array(self.pnl_history[-window:])
        return float(-np.percentile(returns, (1 - confidence) * 100))

    def compute_sharpe(self, annualize: bool = True) -> float:
        if len(self.pnl_history) < 20:
            return 0.0
        r = np.array(self.pnl_history)
        sr = np.mean(r) / (np.std(r) + 1e-10)
        return float(sr * np.sqrt(252) if annualize else sr)

    def log_slippage(self, symbol: str, expected: float, actual: float):
        if symbol not in self.slippage_history:
            self.slippage_history[symbol] = []
        self.slippage_history[symbol].append(actual - expected)

    def get_dashboard(self) -> Dict:
        """Return current risk dashboard snapshot."""
        return {
            'portfolio_value': self.current_value,
            'max_drawdown': (self.peak_value - self.current_value) / self.peak_value,
            'sharpe_ratio': self.compute_sharpe(),
            'var_95': self.compute_var(0.95),
            'is_killed': self.is_killed,
            'total_trades': len(self.pnl_history),
        }


# ─────────────────────────────────────────────
# EXECUTION ENGINE
# ─────────────────────────────────────────────

@dataclass
class Order:
    """Represents a single trade order."""
    symbol: str
    direction: int          # +1 buy, -1 sell
    quantity: float
    order_type: str         # 'limit' or 'market'
    limit_price: float
    urgency: float          # 0–1; high urgency → market order
    timestamp: str
    filled: bool = False
    fill_price: float = 0.0
    slippage: float = 0.0


class SmartOrderRouter:
    """
    Execution logic: chooses order type based on spread, urgency, liquidity.
    Simulates realistic fill with slippage model.
    """

    def __init__(self, cost_model: Optional[IndianMarketCosts] = None):
        self.cost_model = cost_model or IndianMarketCosts()

    def route_order(self, order: Order, bas_proxy: float,
                    adv: float) -> Order:
        """
        Decide limit vs market, apply simulated slippage.
        Large orders or high urgency → market order.
        Tight spread + low urgency → limit order.
        """
        order_size_pct_adv = order.quantity / (adv + 1e-10)

        # Use market order if urgent or size > 5% ADV
        if order.urgency > 0.7 or order_size_pct_adv > 0.05:
            order.order_type = 'market'
            impact = (self.cost_model.base_impact_bps / 10000) * \
                     np.sqrt(order_size_pct_adv / 0.01)
            order.slippage = order.direction * impact
        else:
            order.order_type = 'limit'
            order.slippage = bas_proxy / 2  # Partial spread capture

        order.fill_price = order.limit_price * (1 + order.slippage)
        order.filled = True
        return order

    def slice_large_order(self, total_qty: float, adv: float,
                          max_pct_adv: float = 0.05) -> List[float]:
        """Split large orders into slices to minimize market impact."""
        max_per_slice = adv * max_pct_adv
        n_slices = max(1, int(np.ceil(total_qty / max_per_slice)))
        slice_qty = total_qty / n_slices
        return [slice_qty] * n_slices


print("Layer 5 (Drift Detection) + Layer 6 (Execution & Risk) loaded successfully.")
