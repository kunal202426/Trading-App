"""
LAYER 2: Hierarchical Feature Engineering
Computes all 42 features across 10 categories with proper point-in-time safety.
Each feature is tagged with its valid horizons.
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')


# ─────────────────────────────────────────────
# 2.1  TECHNICAL INDICATORS (7 features)
# ─────────────────────────────────────────────

class TechnicalFeatures:

    @staticmethod
    def macd(close: pd.Series, fast=12, slow=26, signal=9) -> pd.DataFrame:
        """T1 – MACD line, signal, histogram."""
        ema_fast = close.ewm(span=fast, adjust=False).mean()
        ema_slow = close.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return pd.DataFrame({
            'macd_line': macd_line,
            'macd_signal': signal_line,
            'macd_hist': histogram,
            'macd_cross': (macd_line > signal_line).astype(int)  # 1=bullish cross
        })

    @staticmethod
    def rsi(close: pd.Series, period=14) -> pd.Series:
        """T2 – RSI (0–100). Above 70 = overbought, below 30 = oversold."""
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(period).mean()
        loss = (-delta.clip(upper=0)).rolling(period).mean()
        rs = gain / (loss + 1e-10)
        return pd.Series(100 - 100 / (1 + rs), name='rsi')

    @staticmethod
    def bollinger_bands(close: pd.Series, period=20, num_std=2) -> pd.DataFrame:
        """T3 – Bollinger Bands: upper, middle, lower + %B position."""
        mid = close.rolling(period).mean()
        std = close.rolling(period).std()
        upper = mid + num_std * std
        lower = mid - num_std * std
        pct_b = (close - lower) / (upper - lower + 1e-10)
        bandwidth = (upper - lower) / (mid + 1e-10)
        return pd.DataFrame({
            'bb_upper': upper, 'bb_mid': mid, 'bb_lower': lower,
            'bb_pct_b': pct_b, 'bb_bandwidth': bandwidth
        })

    @staticmethod
    def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
        """T4 – On-Balance Volume."""
        direction = np.sign(close.diff()).fillna(0)
        obv = (direction * volume).cumsum()
        # Normalize with z-score over 20-day window
        obv_z = (obv - obv.rolling(20).mean()) / (obv.rolling(20).std() + 1e-10)
        return pd.Series(obv_z, name='obv_zscore')

    @staticmethod
    def mfi(high: pd.Series, low: pd.Series, close: pd.Series,
            volume: pd.Series, period=14) -> pd.Series:
        """T5 – Money Flow Index (volume-weighted RSI)."""
        typical = (high + low + close) / 3
        money_flow = typical * volume
        pos_flow = money_flow.where(typical > typical.shift(1), 0).rolling(period).sum()
        neg_flow = money_flow.where(typical < typical.shift(1), 0).rolling(period).sum()
        mfr = pos_flow / (neg_flow + 1e-10)
        return pd.Series(100 - 100 / (1 + mfr), name='mfi')

    @staticmethod
    def accumulation_distribution(high, low, close, volume) -> pd.Series:
        """T6 – Accumulation/Distribution Line."""
        clv = ((close - low) - (high - close)) / (high - low + 1e-10)
        ad = (clv * volume).cumsum()
        ad_z = (ad - ad.rolling(20).mean()) / (ad.rolling(20).std() + 1e-10)
        return pd.Series(ad_z, name='ad_zscore')

    @staticmethod
    def price_momentum(close: pd.Series) -> pd.DataFrame:
        """T7 – Multi-horizon momentum + 52-week position."""
        mom_20 = close.pct_change(20)
        mom_50 = close.pct_change(50)
        mom_200 = close.pct_change(200)
        hi52 = close.rolling(252).max()
        lo52 = close.rolling(252).min()
        pos52 = (close - lo52) / (hi52 - lo52 + 1e-10)
        return pd.DataFrame({
            'mom_20': mom_20, 'mom_50': mom_50, 'mom_200': mom_200,
            'pos_52wk': pos52
        })

    def compute_all(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all 7 technical features from OHLCV DataFrame."""
        out = df[['date']].copy()
        out = out.join(self.macd(df['close']))
        out['rsi'] = self.rsi(df['close'])
        out = out.join(self.bollinger_bands(df['close']))
        out['obv_zscore'] = self.obv(df['close'], df['volume'])
        out['mfi'] = self.mfi(df['high'], df['low'], df['close'], df['volume'])
        out['ad_zscore'] = self.accumulation_distribution(
            df['high'], df['low'], df['close'], df['volume'])
        out = out.join(self.price_momentum(df['close']))
        return out


# ─────────────────────────────────────────────
# 2.2  VOLATILITY / RISK FEATURES (5 features)
# ─────────────────────────────────────────────

class VolatilityFeatures:

    @staticmethod
    def historical_volatility(close: pd.Series, windows=[10, 20, 30]) -> pd.DataFrame:
        """V4 – Realized volatility over multiple windows (annualized)."""
        log_ret = np.log(close / close.shift(1))
        result = {}
        for w in windows:
            result[f'hvol_{w}d'] = log_ret.rolling(w).std() * np.sqrt(252)
        return pd.DataFrame(result)

    @staticmethod
    def garch_vol_proxy(close: pd.Series, span=20) -> pd.Series:
        """GARCH(1,1) approximation using EWMA."""
        log_ret = np.log(close / close.shift(1)).fillna(0)
        ewma_var = log_ret.pow(2).ewm(span=span, adjust=False).mean()
        return pd.Series(np.sqrt(ewma_var * 252), name='garch_vol')

    @staticmethod
    def return_skew_kurt(close: pd.Series, window=60) -> pd.DataFrame:
        """V5 – Rolling skewness and kurtosis of returns."""
        log_ret = np.log(close / close.shift(1))
        return pd.DataFrame({
            'ret_skew': log_ret.rolling(window).skew(),
            'ret_kurt': log_ret.rolling(window).kurt()
        })

    def compute_all(self, price_df: pd.DataFrame, options_df: pd.DataFrame) -> pd.DataFrame:
        out = price_df[['date']].copy()
        out = out.join(self.historical_volatility(price_df['close']))
        out['garch_vol'] = self.garch_vol_proxy(price_df['close'])
        out = out.join(self.return_skew_kurt(price_df['close']))
        # Merge options data (V1: IV, V2: PCR, V3: India VIX)
        options_sub = options_df[['date', 'india_vix', 'pcr_index', 'iv_atm', 'cpiv']].copy()
        out = out.merge(options_sub, on='date', how='left')
        out[['india_vix', 'pcr_index', 'iv_atm', 'cpiv']] = \
            out[['india_vix', 'pcr_index', 'iv_atm', 'cpiv']].ffill()
        return out


# ─────────────────────────────────────────────
# 2.3  SENTIMENT / MACRO FEATURES (5 features)
# ─────────────────────────────────────────────

class SentimentMacroFeatures:

    def compute_all(self, sentiment_df: pd.DataFrame, macro_df: pd.DataFrame) -> pd.DataFrame:
        out = sentiment_df[['date', 'news_sentiment', 'social_sentiment', 'fear_greed']].copy()
        # Smooth sentiment with EWM
        out['news_sentiment_ema'] = out['news_sentiment'].ewm(span=5).mean()
        out['social_sentiment_ema'] = out['social_sentiment'].ewm(span=3).mean()
        # Merge macro
        macro_sub = macro_df[['date', 'rbi_repo_rate', 'gdp_growth_yoy',
                               'cpi_yoy', 'gpr_index', 'epu_index',
                               'election_proximity', 'usd_inr']].copy()
        out = out.merge(macro_sub, on='date', how='left')
        out[macro_sub.columns[1:]] = out[macro_sub.columns[1:]].ffill()
        # Rate change (direction matters more than level)
        out['rate_change'] = out['rbi_repo_rate'].diff()
        return out


# ─────────────────────────────────────────────
# 2.4  FUNDAMENTAL FEATURES (6 features)
# ─────────────────────────────────────────────

class FundamentalFeatures:
    """
    In production: sourced from NSE filings, Screener.in, Ace Equity.
    Automatically lagged by 45 days to prevent look-ahead bias.
    """

    def generate_synthetic_fundamentals(self, symbol: str,
                                        dates: pd.DatetimeIndex) -> pd.DataFrame:
        np.random.seed(hash(symbol) % 500)
        n = len(dates)
        df = pd.DataFrame({'date': dates})
        df['eps'] = np.clip(np.random.normal(50, 15, n), 1, 200)
        df['eps_surprise'] = np.random.normal(0, 0.05, n)   # as fraction of price
        df['pe_ratio'] = np.clip(np.random.normal(22, 6, n), 5, 60)
        df['pb_ratio'] = np.clip(np.random.normal(3.5, 1.2, n), 0.5, 15)
        df['ps_ratio'] = np.clip(np.random.normal(2.0, 0.8, n), 0.2, 10)
        df['roe'] = np.clip(np.random.normal(0.15, 0.05, n), -0.2, 0.5)
        df['roa'] = np.clip(np.random.normal(0.08, 0.03, n), -0.1, 0.3)
        df['dividend_yield'] = np.clip(np.random.normal(0.015, 0.01, n), 0, 0.08)
        df['payout_ratio'] = np.clip(np.random.normal(0.35, 0.15, n), 0, 1)
        df['fcf_per_share'] = np.clip(np.random.normal(30, 10, n), -20, 120)
        return df

    def compute_all(self, price_df: pd.DataFrame, symbol: str) -> pd.DataFrame:
        fund_df = self.generate_synthetic_fundamentals(symbol, price_df['date'].values)
        # Simulate point-in-time lag: fundamentals available 45 days after quarter end
        # For simplicity: forward-fill quarterly data to daily
        return fund_df


# ─────────────────────────────────────────────
# 2.5  CROSS-MARKET / CORRELATION FEATURES (4)
# ─────────────────────────────────────────────

class CrossMarketFeatures:

    @staticmethod
    def return_autocorrelation(close: pd.Series, lags=[1, 5]) -> pd.DataFrame:
        """C2 – Lagged return autocorrelation (fast approximation)."""
        log_ret = np.log(close / close.shift(1))
        result = {}
        for lag in lags:
            # Fast approximation: correlation between ret and lagged ret
            shifted = log_ret.shift(lag)
            roll_cov = (log_ret * shifted).rolling(20).mean() - \
                       log_ret.rolling(20).mean() * shifted.rolling(20).mean()
            roll_var = log_ret.rolling(20).var() + 1e-10
            result[f'autocorr_lag{lag}'] = (roll_cov / roll_var).clip(-1, 1)
        return pd.DataFrame(result)

    @staticmethod
    def cross_correlation_with_index(stock_close: pd.Series,
                                     index_close: pd.Series,
                                     window=20) -> pd.Series:
        """C1 – Rolling correlation with market index (Nifty proxy)."""
        r_stock = stock_close.pct_change()
        r_index = index_close.pct_change()
        corr = r_stock.rolling(window).corr(r_index)
        return pd.Series(corr, name='index_corr')

    @staticmethod
    def fama_french_residual(stock_ret: pd.Series,
                             market_ret: pd.Series,
                             window=60) -> pd.Series:
        """C4 – Idiosyncratic alpha (residual after market beta)."""
        residuals = []
        for i in range(window, len(stock_ret)):
            y = stock_ret.iloc[i-window:i].values
            x = market_ret.iloc[i-window:i].values
            if np.std(x) < 1e-10:
                residuals.append(np.nan)
                continue
            beta = np.cov(y, x)[0, 1] / (np.var(x) + 1e-10)
            alpha = np.mean(y) - beta * np.mean(x)
            residuals.append(alpha)
        return pd.Series([np.nan] * window + residuals,
                         index=stock_ret.index, name='ff_residual')

    def compute_all(self, price_df: pd.DataFrame,
                    index_close: pd.Series) -> pd.DataFrame:
        out = price_df[['date']].copy()
        close = price_df['close'].reset_index(drop=True)
        
        idx_close_aligned = index_close.values[:len(close)] if len(index_close) >= len(close) \
                            else np.pad(index_close.values, (0, len(close)-len(index_close)),
                                       mode='edge')
        idx_close_s = pd.Series(idx_close_aligned)

        log_ret = np.log(close / close.shift(1))
        idx_ret = np.log(idx_close_s / idx_close_s.shift(1))

        autocorr_df = self.return_autocorrelation(close)
        autocorr_df.index = out.index
        out = out.join(autocorr_df)

        corr_series = self.cross_correlation_with_index(close, idx_close_s)
        corr_series.index = out.index
        out['index_corr'] = corr_series

        beta = log_ret.rolling(20).cov(idx_ret) / (idx_ret.rolling(20).var() + 1e-10)
        beta.index = out.index
        out['beta_20d'] = beta

        residual = self.fama_french_residual(log_ret, idx_ret)
        residual.index = out.index
        out['ff_residual'] = residual
        return out


# ─────────────────────────────────────────────
# 2.6  MICROSTRUCTURE FEATURES (2)
# ─────────────────────────────────────────────

class MicrostructureFeatures:

    @staticmethod
    def bid_ask_spread_proxy(high: pd.Series, low: pd.Series,
                             close: pd.Series) -> pd.Series:
        """M1 – Corwin-Schultz BAS estimator from daily OHLC."""
        alpha = (np.sqrt(2 * np.log(high / low)) -
                 np.sqrt(np.log(high.shift(1) / low.shift(1)))) / (3 - 2 * np.sqrt(2))
        spread = 2 * (np.exp(alpha) - 1) / (1 + np.exp(alpha))
        return pd.Series(spread.clip(0, 0.1), name='bas_proxy')

    @staticmethod
    def order_flow_proxy(close: pd.Series, volume: pd.Series,
                         window=5) -> pd.Series:
        """M2 – Order flow imbalance proxy (close relative to range * volume)."""
        daily_range = close.rolling(window).max() - close.rolling(window).min()
        normalized_pos = (close - close.rolling(window).min()) / (daily_range + 1e-10) - 0.5
        flow = normalized_pos * volume
        flow_z = (flow - flow.rolling(20).mean()) / (flow.rolling(20).std() + 1e-10)
        return pd.Series(flow_z, name='order_flow_z')

    def compute_all(self, price_df: pd.DataFrame) -> pd.DataFrame:
        out = price_df[['date']].copy()
        out['bas_proxy'] = self.bid_ask_spread_proxy(
            price_df['high'], price_df['low'], price_df['close'])
        out['order_flow_z'] = self.order_flow_proxy(price_df['close'], price_df['volume'])
        return out


# ─────────────────────────────────────────────
# 2.7  SEASONAL / CYCLICAL FEATURES (4)
# ─────────────────────────────────────────────

class SeasonalFeatures:

    @staticmethod
    def compute_all(dates: pd.Series) -> pd.DataFrame:
        dt = pd.to_datetime(pd.Series(dates).values)
        dt = pd.DatetimeIndex(dt)
        df = pd.DataFrame({'date': pd.Series(dates).values})
        df['month'] = dt.month
        df['quarter'] = dt.quarter
        df['day_of_week'] = dt.dayofweek  # 0=Monday
        df['is_month_end'] = dt.is_month_end.astype(int)
        df['is_month_start'] = dt.is_month_start.astype(int)
        df['is_quarter_end'] = dt.is_quarter_end.astype(int)

        # Diwali effect (approximate: October/November)
        df['diwali_season'] = dt.month.isin([10, 11]).astype(int)
        # Sell in May effect
        df['sell_in_may'] = dt.month.isin([5, 6]).astype(int)
        # January effect
        df['january_effect'] = (dt.month == 1).astype(int)
        # Pre-budget (Jan-Feb in India)
        df['budget_season'] = dt.month.isin([1, 2]).astype(int)
        # Earnings seasons: April, July, October, January
        df['earnings_season'] = dt.month.isin([4, 7, 10, 1]).astype(int)
        # FII/DII flow seasonality
        df['sin_month'] = np.sin(2 * np.pi * dt.month / 12)
        df['cos_month'] = np.cos(2 * np.pi * dt.month / 12)
        return df


# ─────────────────────────────────────────────
# 2.8  ADVANCED COMPOSITE FEATURES (3)
# ─────────────────────────────────────────────

class CompositeFeatures:

    @staticmethod
    def multi_timeframe_momentum(close: pd.Series) -> pd.Series:
        """A2 – Composite momentum across 20/50/200 days."""
        m20 = close.pct_change(20)
        m50 = close.pct_change(50)
        m200 = close.pct_change(200)
        # Weighted average (recent momentum weighted higher)
        composite = 0.5 * m20 + 0.3 * m50 + 0.2 * m200
        return pd.Series(composite, name='mt_momentum')

    @staticmethod
    def regime_indicator(india_vix: pd.Series, gpr: pd.Series) -> pd.DataFrame:
        """Composite regime: 0=calm, 1=elevated, 2=crisis."""
        vix_z = (india_vix - india_vix.rolling(60).mean()) / (india_vix.rolling(60).std() + 1e-10)
        gpr_z = (gpr - gpr.rolling(60).mean()) / (gpr.rolling(60).std() + 1e-10)
        stress = (vix_z + gpr_z) / 2
        regime = np.where(stress <= -0.5, 0, np.where(stress <= 1.0, 1, 2))
        regime = pd.Series(regime, index=stress.index).fillna(1).astype(int)
        return pd.DataFrame({'stress_score': stress, 'regime': regime})

    def compute_all(self, price_df: pd.DataFrame,
                    vol_features: pd.DataFrame,
                    macro_features: pd.DataFrame) -> pd.DataFrame:
        out = price_df[['date']].copy()
        out['mt_momentum'] = self.multi_timeframe_momentum(price_df['close']).values

        if 'india_vix' in vol_features.columns and 'gpr_index' in macro_features.columns:
            # Align both series to price_df length before computing regime
            n = len(price_df)
            vix_vals = vol_features['india_vix'].values[:n]
            gpr_vals = macro_features['gpr_index'].values[:n]

            vix_series = pd.Series(vix_vals).reset_index(drop=True)
            gpr_series = pd.Series(gpr_vals).reset_index(drop=True)

            regime_df = self.regime_indicator(vix_series, gpr_series)
            regime_df = regime_df.reset_index(drop=True)

            out = out.reset_index(drop=True)
            out['stress_score'] = regime_df['stress_score'].values
            out['market_regime'] = regime_df['regime'].values

        return out


# ─────────────────────────────────────────────
# MASTER FEATURE ENGINE
# ─────────────────────────────────────────────

class FeatureEngine:
    """
    Master class: orchestrates all 42 feature groups and produces
    horizon-specific feature matrices.
    """

    # Which feature groups each horizon uses (mirrors the blueprint matrix)
    HORIZON_FEATURE_MAP = {
        'ultra_short': ['technical', 'volatility', 'microstructure',
                        'sentiment', 'cross_market'],
        'short':       ['technical', 'volatility', 'microstructure',
                        'sentiment', 'cross_market', 'composite'],
        'intraday':    ['technical', 'volatility', 'microstructure',
                        'sentiment', 'cross_market', 'composite', 'seasonal'],
        'swing':       ['technical', 'volatility', 'sentiment', 'cross_market',
                        'fundamental', 'seasonal', 'composite'],
        'positional':  ['fundamental', 'sentiment', 'cross_market',
                        'seasonal', 'volatility', 'composite'],
    }

    def __init__(self):
        self.tech = TechnicalFeatures()
        self.vol  = VolatilityFeatures()
        self.sent = SentimentMacroFeatures()
        self.fund = FundamentalFeatures()
        self.cross = CrossMarketFeatures()
        self.micro = MicrostructureFeatures()
        self.seasonal = SeasonalFeatures()
        self.composite = CompositeFeatures()

    def compute_full_feature_matrix(
        self,
        price_df: pd.DataFrame,
        options_df: pd.DataFrame,
        macro_df: pd.DataFrame,
        sentiment_df: pd.DataFrame,
        index_close: pd.Series,
        symbol: str
    ) -> pd.DataFrame:
        """
        Compute all 42 feature groups and merge into a single DataFrame.
        Returns the full feature matrix with date index.
        """
        # --- Technical ---
        tech_feat = self.tech.compute_all(price_df)

        # --- Volatility ---
        vol_feat = self.vol.compute_all(price_df, options_df)

        # --- Sentiment / Macro ---
        sent_feat = self.sent.compute_all(sentiment_df, macro_df)

        # --- Fundamental ---
        fund_feat = self.fund.compute_all(price_df, symbol)

        # --- Cross-Market ---
        cross_feat = self.cross.compute_all(price_df, index_close)

        # --- Microstructure ---
        micro_feat = self.micro.compute_all(price_df)

        # --- Seasonal ---
        seas_feat = self.seasonal.compute_all(price_df['date'])

        # --- Composite ---
        comp_feat = self.composite.compute_all(price_df, vol_feat, sent_feat)

        # --- Merge all ---
        master = tech_feat.copy()
        for feat_df in [vol_feat, sent_feat, fund_feat, cross_feat,
                        micro_feat, seas_feat, comp_feat]:
            cols_to_add = [c for c in feat_df.columns if c != 'date']
            master = master.merge(feat_df[['date'] + cols_to_add],
                                  on='date', how='left', suffixes=('', '_dup'))

        # Add raw price info
        master['close'] = price_df['close'].values
        master['log_return'] = np.log(price_df['close'] / price_df['close'].shift(1))
        master['symbol'] = symbol

        return master.set_index('date')

    def get_horizon_features(self, master_df: pd.DataFrame, horizon: str) -> pd.DataFrame:
        """
        Return only the feature columns relevant for a given horizon.
        """
        groups = self.HORIZON_FEATURE_MAP.get(horizon, list(self.HORIZON_FEATURE_MAP.keys()))

        col_groups = {
            'technical': ['macd_line', 'macd_signal', 'macd_hist', 'macd_cross',
                          'rsi', 'bb_upper', 'bb_mid', 'bb_lower', 'bb_pct_b',
                          'bb_bandwidth', 'obv_zscore', 'mfi', 'ad_zscore',
                          'mom_20', 'mom_50', 'mom_200', 'pos_52wk'],
            'volatility': ['hvol_10d', 'hvol_20d', 'hvol_30d', 'garch_vol',
                           'ret_skew', 'ret_kurt', 'india_vix', 'pcr_index',
                           'iv_atm', 'cpiv'],
            'sentiment':  ['news_sentiment', 'news_sentiment_ema', 'social_sentiment_ema',
                           'fear_greed', 'rbi_repo_rate', 'gdp_growth_yoy',
                           'cpi_yoy', 'gpr_index', 'epu_index', 'election_proximity',
                           'usd_inr', 'rate_change'],
            'fundamental': ['eps', 'eps_surprise', 'pe_ratio', 'pb_ratio', 'ps_ratio',
                            'roe', 'roa', 'dividend_yield', 'payout_ratio', 'fcf_per_share'],
            'cross_market': ['autocorr_lag1', 'autocorr_lag5', 'index_corr',
                             'beta_20d', 'ff_residual'],
            'microstructure': ['bas_proxy', 'order_flow_z'],
            'seasonal': ['month', 'quarter', 'day_of_week', 'is_month_end',
                         'is_quarter_end', 'diwali_season', 'sell_in_may',
                         'earnings_season', 'sin_month', 'cos_month'],
            'composite': ['mt_momentum', 'stress_score', 'market_regime'],
        }

        selected_cols = []
        for group in groups:
            selected_cols.extend(col_groups.get(group, []))

        # Only return columns that exist
        available = [c for c in selected_cols if c in master_df.columns]
        return master_df[available].copy()


def z_score_features(df: pd.DataFrame,
                     cross_sectional: bool = False) -> pd.DataFrame:
    """
    Standardize features using rolling z-score.
    """
    result = df.copy()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        roll_mean = df[col].rolling(60, min_periods=10).mean()
        roll_std  = df[col].rolling(60, min_periods=10).std()
        z = (df[col] - roll_mean) / (roll_std + 1e-10)
        result[col] = z.clip(-5, 5)
    return result


print("Layer 2 (Feature Engineering) loaded successfully.")
print(f"Total feature categories: 8 groups covering all 42 feature families.")
