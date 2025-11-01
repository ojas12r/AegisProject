/**
 * API Client - Handles all backend communication
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PredictResponse {
  ticker: string;
  predictions: {
    xgboost: {
      return_prediction: number;
      direction: string;
      direction_confidence: number;
      model: string;
    };
    lstm: {
      predicted_price: number;
      current_price: number;
      price_change_pct: number;
      forecast_5d: number[];
      direction: string;
      model: string;
    };
    feature_importance: Array<{ feature: string; importance: number }>;
  };
  status: string;
}

export interface AgentResult {
  agent: string;
  decision: string;
  confidence: number;
  reasoning: string[];
  summary: string;
  [key: string]: unknown;
}

export interface AnalyzeResponse {
  ticker: string;
  analysis: {
    technical: AgentResult & {
      signal_score: number;
      strength: string;
      indicators: Record<string, number>;
    };
    sentiment: AgentResult & {
      sentiment_score: number;
      volume_ratio: number;
      momentum_10d: number;
      news_sentiment: number;
    };
    volatility: AgentResult & {
      regime: string;
      regime_label: string;
      regime_color: string;
      vol_trend: string;
      risk_recommendation: string;
      metrics: Record<string, number>;
    };
  };
  status: string;
}

export interface DecisionResponse {
  ticker: string;
  decision: {
    decision: string;
    confidence: number;
    weighted_score: number;
    signal_breakdown: Record<string, { score: number; weight: number; weighted: number }>;
    cot_reasoning: string[];
    regime: string;
    risk_level: string;
  };
  predictions: PredictResponse['predictions'];
  analysis: AnalyzeResponse['analysis'];
  status: string;
}

export interface MarketDataPoint {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  RSI: number;
  MACD: number;
  MACD_Signal: number;
  BB_Upper: number;
  BB_Lower: number;
  EMA_21: number;
  EMA_50: number;
  [key: string]: unknown;
}

export interface BacktestResponse {
  ticker: string;
  backtest: {
    metrics: {
      total_return: number;
      buy_hold_return: number;
      sharpe_ratio: number;
      sortino_ratio: number;
      calmar_ratio: number;
      max_drawdown: number;
      win_rate: number;
      final_capital: number;
      initial_capital: number;
      alpha: number;
    };
    equity_curve: Array<{ date: string; equity: number; price: number; signal: number }>;
    total_trades: number;
  };
  status: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  getDecision: (ticker: string, period = '1y') =>
    request<DecisionResponse>('/decision', {
      method: 'POST',
      body: JSON.stringify({ ticker, period }),
    }),

  getMarketData: (ticker: string, period = '1y') =>
    request<{ ticker: string; data: MarketDataPoint[]; status: string }>(
      `/market-data/${ticker}?period=${period}`
    ),

  getBacktest: (ticker: string, period = '2y', initial_capital = 100000) =>
    request<BacktestResponse>('/backtest', {
      method: 'POST',
      body: JSON.stringify({ ticker, period, initial_capital }),
    }),

  health: () => request<{ status: string }>('/health'),
};
