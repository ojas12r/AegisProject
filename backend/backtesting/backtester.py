"""
Backtesting Module
Simulates strategy performance with key metrics
"""

import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class Backtester:
    def run(self, features_df: pd.DataFrame, raw_df: pd.DataFrame, initial_capital: float = 100_000.0) -> dict:
        """Run full backtesting simulation"""
        df = features_df.copy()

        if 'RSI' not in df.columns or 'MACD' not in df.columns:
            return self._empty_result()

        # Generate signals using technical rules
        signals = self._generate_signals(df)
        df = df.iloc[:len(signals)].copy()
        df['Signal'] = signals

        # Simulate portfolio
        portfolio = self._simulate_portfolio(df, raw_df, initial_capital)

        # Compute metrics
        metrics = self._compute_metrics(portfolio, initial_capital)

        # Build equity curve data
        equity_curve = []
        for i, (date, row) in enumerate(portfolio.iterrows()):
            equity_curve.append({
                "date": str(date.date()) if hasattr(date, 'date') else str(date),
                "equity": round(float(row['Portfolio_Value']), 2),
                "price": round(float(raw_df['Close'].iloc[i]) if i < len(raw_df) else 0, 2),
                "signal": int(row.get('Signal', 0))
            })

        return {
            "metrics": metrics,
            "equity_curve": equity_curve[-252:],  # Last 252 trading days
            "total_trades": int(df['Signal'].diff().abs().sum()),
        }

    def _generate_signals(self, df: pd.DataFrame) -> np.ndarray:
        """Generate buy/sell signals from indicators"""
        signals = np.zeros(len(df))

        for i in range(1, len(df)):
            row = df.iloc[i]
            score = 0

            # RSI signal
            rsi = row.get('RSI', 50)
            if rsi < 35:
                score += 1
            elif rsi > 65:
                score -= 1

            # MACD signal
            macd = row.get('MACD', 0)
            macd_sig = row.get('MACD_Signal', 0)
            if macd > macd_sig:
                score += 1
            else:
                score -= 1

            # EMA cross
            ema_cross = row.get('EMA_Cross', 0)
            if ema_cross > 0:
                score += 1
            else:
                score -= 1

            # Momentum
            mom = row.get('Momentum_5', 0)
            if mom > 0.02:
                score += 1
            elif mom < -0.02:
                score -= 1

            # Convert to signal
            if score >= 2:
                signals[i] = 1
            elif score <= -2:
                signals[i] = -1

        return signals

    def _simulate_portfolio(self, df: pd.DataFrame, raw_df: pd.DataFrame, capital: float) -> pd.DataFrame:
        """Simulate portfolio value over time"""
        portfolio = pd.DataFrame(index=df.index[:len(raw_df)])
        portfolio['Signal'] = df['Signal'].values[:len(portfolio)]
        portfolio['Price'] = raw_df['Close'].values[:len(portfolio)]
        portfolio['Returns'] = portfolio['Price'].pct_change()

        # Strategy returns
        portfolio['Strategy_Returns'] = portfolio['Signal'].shift(1) * portfolio['Returns']
        portfolio['Portfolio_Value'] = capital * (1 + portfolio['Strategy_Returns']).cumprod()
        portfolio['Portfolio_Value'] = portfolio['Portfolio_Value'].fillna(capital)

        return portfolio

    def _compute_metrics(self, portfolio: pd.DataFrame, initial_capital: float) -> dict:
        """Compute performance metrics"""
        returns = portfolio['Strategy_Returns'].dropna()
        equity = portfolio['Portfolio_Value']

        total_return = (equity.iloc[-1] / initial_capital - 1) * 100
        buy_hold_return = (portfolio['Price'].iloc[-1] / portfolio['Price'].iloc[0] - 1) * 100

        # Sharpe ratio (annualized, assuming 252 trading days)
        mean_return = returns.mean()
        std_return = returns.std()
        sharpe = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0

        # Max drawdown
        rolling_max = equity.cummax()
        drawdown = (equity - rolling_max) / rolling_max
        max_drawdown = drawdown.min() * 100

        # Calmar ratio
        calmar = (total_return / abs(max_drawdown)) if max_drawdown < 0 else 0

        # Win rate
        daily_returns = returns[returns != 0]
        win_rate = (daily_returns > 0).mean() * 100 if len(daily_returns) > 0 else 50

        # Sortino ratio
        downside_returns = returns[returns < 0]
        downside_std = downside_returns.std()
        sortino = (mean_return / downside_std * np.sqrt(252)) if downside_std > 0 else 0

        return {
            "total_return": round(total_return, 2),
            "buy_hold_return": round(buy_hold_return, 2),
            "sharpe_ratio": round(sharpe, 3),
            "sortino_ratio": round(sortino, 3),
            "calmar_ratio": round(calmar, 3),
            "max_drawdown": round(max_drawdown, 2),
            "win_rate": round(win_rate, 1),
            "final_capital": round(float(equity.iloc[-1]), 2),
            "initial_capital": initial_capital,
            "alpha": round(total_return - buy_hold_return, 2)
        }

    def _empty_result(self):
        return {
            "metrics": {
                "total_return": 0, "buy_hold_return": 0, "sharpe_ratio": 0,
                "sortino_ratio": 0, "calmar_ratio": 0, "max_drawdown": 0,
                "win_rate": 50, "final_capital": 100000, "initial_capital": 100000, "alpha": 0
            },
            "equity_curve": [],
            "total_trades": 0
        }
