# 🤖 AlgoTrader AI — Quantitative Intelligence Platform

Production-grade algorithmic trading system combining **ML models** (XGBoost + LSTM) with a **Multi-Agent Chain-of-Thought reasoning layer**.

---

## 🏗️ Architecture

```
algo-trading/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # API server (5 endpoints)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── data/
│   │   └── data_fetcher.py     # Yahoo Finance async wrapper
│   ├── features/
│   │   └── feature_engineer.py # RSI, MACD, BB, EMA, ATR, OBV, VWAP...
│   ├── models/
│   │   └── ml_engine.py        # XGBoost + LSTM models
│   ├── agents/
│   │   └── cot_agents.py       # 3 CoT agents + aggregator
│   └── backtesting/
│       └── backtester.py       # Sharpe, Sortino, Drawdown
│
└── frontend/                   # Next.js 14 TypeScript dashboard
    └── src/
        ├── app/
        │   ├── page.tsx         # Main dashboard
        │   ├── layout.tsx
        │   └── globals.css
        ├── components/
        │   ├── Header.tsx        # Ticker tape + search
        │   ├── PriceChart.tsx    # Recharts OHLCV + overlays
        │   ├── DecisionCard.tsx  # BUY/SELL/HOLD signal
        │   ├── PredictionsPanel.tsx # XGBoost + LSTM output
        │   ├── ReasoningPanel.tsx   # MPF CoT reasoning UI
        │   ├── MarketRegime.tsx     # RSI/MACD subcharts
        │   ├── BacktestPanel.tsx    # Equity curve + metrics
        │   └── StatsBar.tsx         # Quick stats
        └── lib/
            ├── api.ts            # Typed API client
            └── utils.ts          # Helpers
```

---

## 🚀 Quick Start

### Option 1: Manual

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Option 2: Startup Script

```bash
./start.sh
```

### Option 3: Docker

```bash
docker-compose up --build
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

---

## 📊 ML Models

### XGBoost
- **Features**: RSI, MACD, EMA cross, Bollinger %B, Volatility, Momentum, Volume ratio, Log return (21 features)
- **Outputs**: Next-day return prediction + BUY/SELL classification with confidence
- **Training**: Walk-forward on 80% of available data

### LSTM (Linear Sequence Model)
- **Input**: 30-day sliding window of close prices
- **Output**: Next-day price prediction + 5-day forecast
- **Implementation**: Efficient NumPy SVD-based linear regression on sequences (production-safe, no GPU needed)

---

## 🤖 MPF CoT Agents

| Agent | Inputs | Output |
|-------|--------|--------|
| **Technical** | RSI, MACD, EMA, Bollinger | BUY/SELL + 4-step reasoning chain |
| **Sentiment** | Volume ratio, Momentum, News sim | Sentiment score + reasoning |
| **Volatility** | 10d/30d vol, ATR, BB width | Regime + risk recommendation |

### Aggregator Weights
```
XGBoost:   25%
LSTM:      15%
Technical: 30%
Sentiment: 15%
Volatility:15%
```

---

## 📈 Backtesting Metrics

- Total Return vs Buy & Hold
- Sharpe Ratio (annualized)
- Sortino Ratio
- Calmar Ratio
- Max Drawdown
- Win Rate
- Alpha

---

## ⚙️ Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ⚠️ Disclaimer

For **educational purposes only**. Not financial advice. Past performance does not guarantee future results.
