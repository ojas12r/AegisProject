"""
Feature Engineering Module
Computes all technical indicators for ML models
"""

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    def compute_all(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all features and return enriched dataframe"""
        result = df.copy()

        result = self.add_rsi(result)
        result = self.add_macd(result)
        result = self.add_ema(result)
        result = self.add_sma(result)
        result = self.add_bollinger_bands(result)
        result = self.add_volatility(result)
        result = self.add_momentum(result)
        result = self.add_volume_features(result)
        result = self.add_returns(result)

        result = result.dropna()
        logger.info(f"Feature engineering complete: {result.shape[1]} features, {len(result)} rows")
        return result

    def add_rsi(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Relative Strength Index"""
        delta = df['Close'].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)

        avg_gain = gain.ewm(span=period, adjust=False).mean()
        avg_loss = loss.ewm(span=period, adjust=False).mean()

        rs = avg_gain / (avg_loss + 1e-10)
        df['RSI'] = 100 - (100 / (1 + rs))
        return df

    def add_macd(self, df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """MACD - Moving Average Convergence Divergence"""
        ema_fast = df['Close'].ewm(span=fast, adjust=False).mean()
        ema_slow = df['Close'].ewm(span=slow, adjust=False).mean()
        df['MACD'] = ema_fast - ema_slow
        df['MACD_Signal'] = df['MACD'].ewm(span=signal, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
        return df

    def add_ema(self, df: pd.DataFrame) -> pd.DataFrame:
        """Exponential Moving Averages"""
        df['EMA_9'] = df['Close'].ewm(span=9, adjust=False).mean()
        df['EMA_21'] = df['Close'].ewm(span=21, adjust=False).mean()
        df['EMA_50'] = df['Close'].ewm(span=50, adjust=False).mean()
        df['EMA_200'] = df['Close'].ewm(span=200, adjust=False).mean()
        df['EMA_Cross'] = (df['EMA_9'] - df['EMA_21']) / df['Close']
        return df

    def add_sma(self, df: pd.DataFrame) -> pd.DataFrame:
        """Simple Moving Averages"""
        df['SMA_20'] = df['Close'].rolling(20).mean()
        df['SMA_50'] = df['Close'].rolling(50).mean()
        df['SMA_200'] = df['Close'].rolling(200).mean()
        df['Price_SMA20_Ratio'] = df['Close'] / df['SMA_20']
        return df

    def add_bollinger_bands(self, df: pd.DataFrame, period: int = 20, std: float = 2.0) -> pd.DataFrame:
        """Bollinger Bands"""
        sma = df['Close'].rolling(period).mean()
        std_dev = df['Close'].rolling(period).std()
        df['BB_Upper'] = sma + (std * std_dev)
        df['BB_Lower'] = sma - (std * std_dev)
        df['BB_Mid'] = sma
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / sma
        df['BB_Pct'] = (df['Close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'] + 1e-10)
        return df

    def add_volatility(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rolling Volatility metrics"""
        log_returns = np.log(df['Close'] / df['Close'].shift(1))
        df['Volatility_10'] = log_returns.rolling(10).std() * np.sqrt(252)
        df['Volatility_30'] = log_returns.rolling(30).std() * np.sqrt(252)
        df['ATR'] = self._atr(df)
        df['ATR_Pct'] = df['ATR'] / df['Close']
        return df

    def add_momentum(self, df: pd.DataFrame) -> pd.DataFrame:
        """Momentum indicators"""
        df['Momentum_5'] = df['Close'] / df['Close'].shift(5) - 1
        df['Momentum_10'] = df['Close'] / df['Close'].shift(10) - 1
        df['Momentum_20'] = df['Close'] / df['Close'].shift(20) - 1
        df['ROC'] = df['Close'].pct_change(12)
        return df

    def add_volume_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Volume-based features"""
        df['Volume_SMA20'] = df['Volume'].rolling(20).mean()
        df['Volume_Ratio'] = df['Volume'] / (df['Volume_SMA20'] + 1e-10)
        df['OBV'] = (np.sign(df['Close'].diff()) * df['Volume']).cumsum()
        df['VWAP'] = (df['Close'] * df['Volume']).rolling(20).sum() / df['Volume'].rolling(20).sum()
        return df

    def add_returns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return targets"""
        df['Return_1d'] = df['Close'].pct_change(1).shift(-1)  # Next day return (target)
        df['Return_5d'] = df['Close'].pct_change(5).shift(-5)
        df['Log_Return'] = np.log(df['Close'] / df['Close'].shift(1))
        return df

    def _atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Average True Range"""
        high_low = df['High'] - df['Low']
        high_close = (df['High'] - df['Close'].shift()).abs()
        low_close = (df['Low'] - df['Close'].shift()).abs()
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_range.ewm(span=period, adjust=False).mean()

    def get_feature_columns(self) -> list:
        """Returns list of ML feature column names"""
        return [
            'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
            'EMA_9', 'EMA_21', 'EMA_50', 'EMA_Cross',
            'SMA_20', 'Price_SMA20_Ratio',
            'BB_Width', 'BB_Pct',
            'Volatility_10', 'Volatility_30', 'ATR_Pct',
            'Momentum_5', 'Momentum_10', 'Momentum_20', 'ROC',
            'Volume_Ratio', 'Log_Return'
        ]
