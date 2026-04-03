# AegisProject

AegisProject is a production-grade AI-powered algorithmic trading system that combines machine learning models with a multi-agent reasoning framework to generate explainable trading signals. Instead of producing a single prediction, the system runs multiple models and specialized agents in parallel and aggregates their outputs into a final decision with a confidence score and reasoning trace.

## Architecture

The system is built around two core layers:

* **Machine Learning Layer**

  * XGBoost model for regression (next-day return) and classification (BUY/SELL)
  * LSTM model for time-series forecasting and multi-step price prediction

* **Multi-Agent Reasoning Layer**

  * Technical Analysis Agent
  * Market Sentiment Agent
  * Volatility and Regime Agent
  * Aggregator (final decision engine)

## Machine Learning Models

The XGBoost model is trained on a comprehensive set of engineered technical features including RSI, MACD, moving averages, Bollinger Bands, volatility measures, momentum indicators, and volume-based signals. It outputs both a numerical return prediction and a directional classification.

The LSTM model operates on rolling windows of historical price data to capture temporal dependencies and generate next-day predictions along with short-term price trajectories.

## Multi-Agent Framework

Three agents analyze the market independently and run asynchronously:

* **Technical Agent** evaluates RSI, MACD, EMA alignment, and Bollinger Band positioning to generate a directional signal.
* **Sentiment Agent** analyzes volume patterns, price momentum, and sentiment inputs to detect accumulation or distribution behavior.
* **Volatility Agent** classifies the market into different volatility regimes and identifies expansion, contraction, or extreme conditions.

Each agent produces a decision, confidence score, and structured reasoning.

## Aggregator

The aggregator combines outputs from:

* XGBoost
* LSTM
* Technical Agent
* Sentiment Agent
* Volatility Agent

It applies a weighted scoring system to generate the final signal:

* Score > 0.35 → BUY
* Score < -0.35 → SELL
* Otherwise → HOLD

Extreme volatility conditions can override decisions to HOLD for risk management.

## Feature Engineering

All indicators are implemented manually using pandas and numpy. The system includes:

* RSI, MACD, EMA, SMA
* Bollinger Bands and ATR
* Volatility (10-day and 30-day)
* Momentum and Rate of Change
* Volume-based indicators and log returns

## Backtesting

The system includes a backtesting module to evaluate strategy performance on historical data.

Key metrics:

* Total return vs benchmark
* Sharpe ratio
* Sortino ratio
* Calmar ratio
* Maximum drawdown
* Win rate and alpha

## API

The backend exposes REST endpoints for:

* `/predict` – ML predictions
* `/analyze` – agent reasoning outputs
* `/decision` – final aggregated signal
* `/backtest` – historical simulation
* `/market-data/{ticker}` – price and indicator data

## Tech Stack

* **Backend:** Python, FastAPI, XGBoost, scikit-learn, pandas, numpy, yfinance
* **Frontend:** Next.js, TypeScript, Tailwind CSS, Recharts
* **Infrastructure:** Docker, Docker Compose

## Running Locally

Clone the repository and start both backend and frontend:

```bash
git clone https://github.com/ojas12r/algo-trading-ai.git
cd algo-trading-ai
```

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on port 3000 and communicates with the backend on port 8000.

## Data Source

Market data is sourced from Yahoo Finance using the yfinance library with split-adjusted prices for consistency.

## Disclaimer

This project is for educational and research purposes only. It does not constitute financial advice. Past performance does not guarantee future results.
