AegisProject




A production-grade algorithmic trading system that combines machine learning models with a multi-agent reasoning framework to generate explainable trading signals.
The system does not simply output a prediction. It runs two independent ML models and three specialized AI agents in parallel, forces them to reason step by step through market conditions, then aggregates their outputs into a single decision with a confidence score and a full chain-of-thought trace you can audit.

Architecture
The system is split into two layers.
The first layer is the machine learning engine. XGBoost is trained on 21 engineered technical features and runs both a regression task (predicting next-day return) and a classification task (predicting direction). An LSTM sequence model runs in parallel on raw OHLCV price data, producing a next-day price estimate and a five-day forward forecast.
The second layer is the Multi-Agent Chain-of-Thought framework. Three agents analyze the market independently from different angles. A fourth component, the aggregator, collects their outputs alongside the ML predictions, applies a weighted scoring system, and produces the final signal.

ML Models
XGBoost
Gradient boosted tree ensemble trained on time-series cross-validated splits. Predicts next-day return as a regression target and BUY or SELL as a binary classification target. Feature importance is extracted per inference and surfaced in the dashboard.
Features used: RSI, MACD, MACD Signal, MACD Histogram, EMA 9, EMA 21, EMA 50, EMA Cross, SMA 20, Price-to-SMA ratio, Bollinger Band width, Bollinger Band percentage, 10-day realized volatility, 30-day realized volatility, ATR percentage, 5-day momentum, 10-day momentum, 20-day momentum, Rate of Change, Volume ratio, Log return.
LSTM
Sequence model trained on a 30-day sliding window of closing prices. Uses SVD-based linear regression on the flattened sequence, which produces accurate multi-step forecasts without requiring GPU infrastructure. Outputs a next-day price prediction and a five-day trajectory.

Multi-Agent Chain-of-Thought Framework
Three agents run concurrently via asyncio. Each agent produces a decision, a confidence score, and a numbered reasoning chain. Their outputs feed into the aggregator.
Technical Analysis Agent
Scores RSI positioning, MACD crossover state, EMA alignment, and Bollinger Band location. Each indicator contributes a signal between -2 and +2. The average determines the directional call. The reasoning chain explains each scoring step explicitly.
Market Sentiment Agent
Analyzes volume patterns relative to the 20-day average, 10-day price momentum, and a news sentiment signal. High volume on positive price action is treated as institutional accumulation. High volume on negative price action is treated as distribution. The output is a sentiment score from 0 to 100 alongside a directional recommendation.
Volatility and Regime Agent
Classifies the current market regime as Low Volatility, Normal, High Volatility, or Extreme based on 10-day and 30-day realized volatility. Detects volatility expansion and contraction by comparing short-term to long-term vol. Identifies Bollinger Band squeezes. Outputs a risk recommendation that can override the final decision if conditions are extreme.
Aggregator
Collects all five signals (XGBoost, LSTM, Technical, Sentiment, Volatility) and combines them using fixed weights. Weighted score above 0.35 produces a BUY. Below -0.35 produces a SELL. Between those thresholds produces a HOLD. Extreme volatility regime triggers an override to HOLD regardless of score. The aggregator outputs the final decision, confidence percentage, weighted score, per-source signal breakdown, and a complete chain-of-thought trace.
Weights: Technical 30%, XGBoost 25%, Sentiment 15%, Volatility 15%, LSTM 15%.

Feature Engineering
All indicators are computed from raw OHLCV data using pandas and numpy. No external indicator library is used.

RSI using exponential weighted moving average of gains and losses
MACD with configurable fast, slow, and signal periods
EMA at 9, 21, 50, and 200 periods
SMA at 20, 50, and 200 periods
Bollinger Bands with 2 standard deviation envelope
Average True Range for daily range normalization
On-Balance Volume for accumulation and distribution tracking
VWAP over 20-day rolling window
Realized volatility annualized at 10 and 30 day windows
Momentum at 5, 10, and 20 day lookbacks
Rate of Change at 12 periods
Log returns and forward returns as model targets


Backtesting
The backtester generates signals from indicator combinations on historical data, simulates a portfolio, and computes the following metrics.

Total return vs buy-and-hold benchmark
Sharpe ratio annualized at 252 trading days
Sortino ratio using downside deviation only
Calmar ratio as return divided by max drawdown
Maximum drawdown as peak-to-trough decline
Win rate across all signal-generating days
Alpha as strategy return minus benchmark return


API Endpoints
MethodEndpointDescriptionPOST/predictXGBoost and LSTM predictionsPOST/analyzeMulti-agent reasoning outputsPOST/decisionFinal aggregated decision with CoT tracePOST/backtestHistorical simulation with performance metricsGET/market-data/{ticker}OHLCV data with computed indicatorsGET/healthSystem health check
Interactive API documentation is available at http://localhost:8000/docs when running locally.

Stack
Backend: Python, FastAPI, Uvicorn, XGBoost, scikit-learn, pandas, numpy, yfinance
Frontend: Next.js 14, TypeScript, Tailwind CSS, Recharts, Lucide React
Infrastructure: Docker, Docker Compose

Running Locally
Clone the repository.
git clone https://github.com/ojas12r/algo-trading-ai.git
cd algo-trading-ai
Start the backend. Navigate to the backend directory, install dependencies, and run the server.
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Start the frontend in a separate terminal window.
cd frontend
npm install
npm run dev
Open http://localhost:3000 in your browser. The backend runs on port 8000 and the frontend on port 3000. Both must be running simultaneously.
To run with Docker instead:
docker-compose up --build

Environment Variables
Create a file named .env.local inside the frontend directory with the following content.
NEXT_PUBLIC_API_URL=http://localhost:8000

Data Source
Market data is sourced from Yahoo Finance via the yfinance library. No API key is required. Prices are split-adjusted using auto_adjust=True to ensure accuracy after stock splits. NVIDIA, for example, underwent a 10-for-1 split in June 2024 and historical prices reflect the post-split equivalent.

Disclaimer
This project is for educational and research purposes only. Nothing in this repository constitutes financial advice. Past performance of any backtested strategy does not guarantee future results. Do not make real trading decisions based on the output of this system.

