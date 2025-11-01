"""
Algorithmic Trading System - FastAPI Backend
Production-grade ML + Multi-Agent Reasoning Engine
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio
from typing import Optional

from models.ml_engine import MLEngine
from agents.cot_agents import MPFCoTOrchestrator
from data.data_fetcher import DataFetcher
from features.feature_engineer import FeatureEngineer
from backtesting.backtester import Backtester

app = FastAPI(
    title="AlgoTrading AI System",
    description="Production-grade algorithmic trading with ML + Multi-Agent Reasoning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core modules
ml_engine = MLEngine()
cot_orchestrator = MPFCoTOrchestrator()
data_fetcher = DataFetcher()
feature_engineer = FeatureEngineer()
backtester = Backtester()


class PredictRequest(BaseModel):
    ticker: str = "AAPL"
    period: str = "1y"


class AnalyzeRequest(BaseModel):
    ticker: str = "AAPL"
    period: str = "1y"


class DecisionRequest(BaseModel):
    ticker: str = "AAPL"
    period: str = "1y"


class BacktestRequest(BaseModel):
    ticker: str = "AAPL"
    period: str = "2y"
    initial_capital: float = 100000.0


@app.get("/")
async def root():
    return {"status": "AlgoTrading AI System Online", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "models": ["xgboost", "lstm"], "agents": ["technical", "sentiment", "volatility"]}


@app.post("/predict")
async def predict(req: PredictRequest):
    """Returns ML predictions from XGBoost and LSTM models"""
    try:
        df = await data_fetcher.fetch(req.ticker, req.period)
        features_df = feature_engineer.compute_all(df)
        predictions = ml_engine.predict(features_df, df)
        return {
            "ticker": req.ticker,
            "predictions": predictions,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Runs MPF CoT multi-agent reasoning pipeline"""
    try:
        df = await data_fetcher.fetch(req.ticker, req.period)
        features_df = feature_engineer.compute_all(df)
        analysis = await cot_orchestrator.run(features_df, df, req.ticker)
        return {
            "ticker": req.ticker,
            "analysis": analysis,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decision")
async def decision(req: DecisionRequest):
    """Returns final aggregated decision with confidence + reasoning"""
    try:
        df = await data_fetcher.fetch(req.ticker, req.period)
        features_df = feature_engineer.compute_all(df)

        # Run ML and agents concurrently
        predictions, analysis = await asyncio.gather(
            asyncio.to_thread(ml_engine.predict, features_df, df),
            cot_orchestrator.run(features_df, df, req.ticker)
        )

        final_decision = cot_orchestrator.aggregate_decision(predictions, analysis)

        return {
            "ticker": req.ticker,
            "decision": final_decision,
            "predictions": predictions,
            "analysis": analysis,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/backtest")
async def backtest(req: BacktestRequest):
    """Runs backtesting simulation with performance metrics"""
    try:
        df = await data_fetcher.fetch(req.ticker, req.period)
        features_df = feature_engineer.compute_all(df)
        results = backtester.run(features_df, df, req.initial_capital)
        return {
            "ticker": req.ticker,
            "backtest": results,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market-data/{ticker}")
async def market_data(ticker: str, period: str = Query(default="1y")):
    """Fetches OHLCV data + computed indicators"""
    try:
        df = await data_fetcher.fetch(ticker, period)
        features_df = feature_engineer.compute_all(df)
        data = features_df.tail(252).reset_index()
        data['Date'] = data['Date'].astype(str)
        return {
            "ticker": ticker,
            "data": data.to_dict(orient="records"),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
