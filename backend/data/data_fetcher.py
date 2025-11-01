"""
Data Fetcher - Yahoo Finance integration
Async wrapper for yfinance with caching
"""

import yfinance as yf
import pandas as pd
import asyncio
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


class DataFetcher:
    def __init__(self):
        self._cache = {}

    async def fetch(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        """Fetch OHLCV data from Yahoo Finance"""
        cache_key = f"{ticker}_{period}"

        if cache_key in self._cache:
            logger.info(f"Cache hit for {cache_key}")
            return self._cache[cache_key]

        df = await asyncio.to_thread(self._download, ticker, period)
        self._cache[cache_key] = df
        return df

    def _download(self, ticker: str, period: str) -> pd.DataFrame:
        """Download data synchronously"""
        logger.info(f"Fetching {ticker} for period {period}")
        ticker_obj = yf.Ticker(ticker)
        df = ticker_obj.history(period=period)

        if df.empty:
            raise ValueError(f"No data found for ticker {ticker}")

        # Standardize columns
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
        df.index.name = 'Date'
        df = df.dropna()

        logger.info(f"Fetched {len(df)} rows for {ticker}")
        return df

    def get_info(self, ticker: str) -> dict:
        """Get company info"""
        try:
            t = yf.Ticker(ticker)
            info = t.info
            return {
                "name": info.get("longName", ticker),
                "sector": info.get("sector", "Unknown"),
                "market_cap": info.get("marketCap", 0),
                "pe_ratio": info.get("trailingPE", None),
                "52w_high": info.get("fiftyTwoWeekHigh", None),
                "52w_low": info.get("fiftyTwoWeekLow", None),
            }
        except Exception:
            return {"name": ticker}
