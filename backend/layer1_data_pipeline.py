"""
LAYER 1: Point-in-Time Data Pipeline
Handles NSE/BSE data ingestion with survivorship-bias prevention and look-ahead protection.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
import warnings

warnings.filterwarnings('ignore')


class PointInTimeDataStore:
    """
    Ensures all data is available only up to the query date.
    Prevents look-ahead bias by tracking as-of dates for each data series.
    """

    def __init__(self):
        self._store: Dict[str, pd.DataFrame] = {}
        self._release_lags: Dict[str, int] = {
            # How many days after period-end each data type becomes available
            'quarterly_fundamentals': 45,   # EPS, P/B etc. ~45 days after quarter end
            'monthly_macro': 30,            # GDP, CPI ~30 days after month end
            'daily_price': 0,               # End-of-day price: same day (after close)
            'intraday': 0,                  # Intraday: real-time
            'news_sentiment': 1,            # NLP aggregation: next-morning
            'options': 0,                   # Options data: same session
            'macro_rbi': 1,                 # RBI announcements: next day
        }

    def register(self, key: str, df: pd.DataFrame, data_type: str = 'daily_price'):
        """Register a dataset with its release lag."""
        lag = self._release_lags.get(data_type, 0)
        df = df.copy()
        # Shift data forward by release lag to simulate real availability
        if 'date' in df.columns:
            df['available_from'] = pd.to_datetime(df['date']) + timedelta(days=lag)
        self._store[key] = (df, lag)

    def query(self, key: str, as_of_date: datetime) -> pd.DataFrame:
        """Return only data available as of query date (point-in-time safe)."""
        if key not in self._store:
            raise KeyError(f"Dataset '{key}' not registered.")
        df, lag = self._store[key]
        if 'available_from' in df.columns:
            return df[df['available_from'] <= as_of_date].copy()
        return df.copy()


class MarketDataLoader:
    """
    Simulates loading OHLCV + metadata for Indian markets.
    In production: connect to NSE/BSE APIs, Bloomberg, Refinitiv, or Zerodha/Angel APIs.
    """

    def __init__(self, universe: List[str], start_date: str, end_date: str):
        self.universe = universe
        self.start_date = pd.to_datetime(start_date)
        self.end_date = pd.to_datetime(end_date)
        self.pit_store = PointInTimeDataStore()

    def load_real_ohlcv(self, symbol: str) -> pd.DataFrame:
        """
        Fetch real OHLCV data from Alpha Vantage.
        NSE symbols are resolved via user_symbol_to_av (e.g. RELIANCE → NSE:RELIANCE).
        Falls back to synthetic data if the API returns no results.
        """
        from alpha_vantage import get_daily_ohlcv, user_symbol_to_av
        av_ticker = user_symbol_to_av(symbol)
        start_str = self.start_date.strftime("%Y-%m-%d") if hasattr(self.start_date, 'strftime') else str(self.start_date)[:10]
        end_str = self.end_date.strftime("%Y-%m-%d") if hasattr(self.end_date, 'strftime') else str(self.end_date)[:10]

        raw = get_daily_ohlcv(av_ticker, start_date=start_str, end_date=end_str)

        if raw.empty:
            print(f"  ⚠ No data for {av_ticker}, using synthetic fallback.")
            return self.generate_synthetic_ohlcv(symbol)

        # Alpha Vantage already returns lowercase columns: date, open, high, low, close, volume, adjusted_close
        df = raw.copy()
        df['symbol'] = symbol
        return df.dropna().reset_index(drop=True)
    
    def generate_synthetic_ohlcv(self, symbol: str, seed: int = 42) -> pd.DataFrame:
        """Fallback synthetic data if real download fails."""
        np.random.seed(seed + hash(symbol) % 1000)
        dates = pd.date_range(self.start_date, self.end_date, freq='B')
        n = len(dates)
        price = 500 * np.exp(np.cumsum(np.random.normal(0.0003, 0.015, n)))
        volume = (1_000_000 * np.abs(np.random.normal(1, 0.3, n))).astype(int)
        return pd.DataFrame({
            'date':           dates,
            'symbol':         symbol,
            'open':           price * np.exp(np.random.normal(0, 0.003, n)),
            'high':           price * 1.01,
            'low':            price * 0.99,
            'close':          price,
            'volume':         volume,
            'adjusted_close': price,
        })

    def load_all(self) -> Dict[str, pd.DataFrame]:
        """Load real OHLCV data for the entire universe via Alpha Vantage."""
        data = {}
        for sym in self.universe:
            print(f"  Downloading {sym} via Alpha Vantage...")
            df = self.load_real_ohlcv(sym)
            self.pit_store.register(sym, df, 'daily_price')
            data[sym] = df
        return data

    def load_options_data(self) -> pd.DataFrame:
        """Simulate options chain data (PCR, IV, Greeks)."""
        dates = pd.date_range(self.start_date, self.end_date, freq='B')
        np.random.seed(99)
        n = len(dates)
        df = pd.DataFrame({
            'date': dates,
            'india_vix': np.clip(15 + np.cumsum(np.random.normal(0, 0.3, n)), 8, 80),
            'pcr_index': np.clip(np.random.normal(0.9, 0.15, n), 0.4, 2.0),
            'iv_atm': np.clip(0.20 + np.cumsum(np.random.normal(0, 0.005, n)), 0.05, 0.80),
            'call_oi': np.random.randint(5_000_000, 20_000_000, n),
            'put_oi':  np.random.randint(4_000_000, 18_000_000, n),
        })
        df['cpiv'] = df['iv_atm'] * np.random.normal(0, 0.02, n)  # Call-Put IV spread
        return df

    def load_macro_data(self) -> pd.DataFrame:
        """Simulate macro indicators (GDP, RBI rates, CPI, GPR, etc.)."""
        dates = pd.date_range(self.start_date, self.end_date, freq='B')
        n = len(dates)
        np.random.seed(7)
        df = pd.DataFrame({
            'date': dates,
            'rbi_repo_rate': np.clip(6.5 + np.cumsum(np.random.normal(0, 0.01, n)), 4, 10),
            'gdp_growth_yoy': np.clip(7.0 + np.random.normal(0, 0.5, n), 2, 12),
            'cpi_yoy': np.clip(5.0 + np.cumsum(np.random.normal(0, 0.02, n)), 2, 10),
            'gpr_index': np.clip(100 + np.cumsum(np.random.normal(0, 2, n)), 50, 300),
            'epu_index': np.clip(150 + np.cumsum(np.random.normal(0, 3, n)), 50, 400),
            'election_proximity': np.zeros(n),  # 1 near election, 0 otherwise
            'usd_inr': np.clip(83 + np.cumsum(np.random.normal(0, 0.05, n)), 70, 95),
        })
        return df

    def load_news_sentiment(self, symbol: str) -> pd.DataFrame:
        """Simulate FinBERT-style sentiment scores."""
        dates = pd.date_range(self.start_date, self.end_date, freq='B')
        n = len(dates)
        np.random.seed(hash(symbol) % 1000)
        df = pd.DataFrame({
            'date': dates,
            'symbol': symbol,
            'news_sentiment': np.clip(np.random.normal(0.05, 0.25, n), -1, 1),
            'social_sentiment': np.clip(np.random.normal(0.0, 0.3, n), -1, 1),
            'fear_greed': np.clip(50 + np.cumsum(np.random.normal(0, 1.5, n)), 0, 100),
        })
        return df


class SurvivourshipBiasFilter:
    """
    Tracks which symbols were actually listed/tradeable at each point in time.
    Prevents including delisted stocks' returns in historical analysis.
    """

    def __init__(self):
        # In production: load from NSE historical constituent lists
        self.listing_dates: Dict[str, datetime] = {}
        self.delisting_dates: Dict[str, Optional[datetime]] = {}

    def register_symbol(self, symbol: str, listed: str, delisted: Optional[str] = None):
        self.listing_dates[symbol] = pd.to_datetime(listed)
        self.delisting_dates[symbol] = pd.to_datetime(delisted) if delisted else None

    def get_tradeable_universe(self, as_of_date: datetime) -> List[str]:
        """Return only symbols tradeable on a given date."""
        tradeable = []
        for sym in self.listing_dates:
            listed = self.listing_dates[sym]
            delisted = self.delisting_dates[sym]
            if listed <= as_of_date:
                if delisted is None or delisted > as_of_date:
                    tradeable.append(sym)
        return tradeable


print("Layer 1 (Data Pipeline) loaded successfully.")
