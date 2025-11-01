'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, DecisionResponse, MarketDataPoint, BacktestResponse } from '@/lib/api';
import { Header } from '@/components/Header';
import { StatsBar } from '@/components/StatsBar';
import { PriceChart } from '@/components/PriceChart';
import { DecisionCard } from '@/components/DecisionCard';
import { PredictionsPanel } from '@/components/PredictionsPanel';
import { ReasoningPanel } from '@/components/ReasoningPanel';
import { MarketRegime } from '@/components/MarketRegime';
import { BacktestPanel } from '@/components/BacktestPanel';
import { ErrorBanner, BackendOffline, FullPageLoader } from '@/components/StateComponents';

const DEFAULT_TICKER = 'AAPL';
const DEFAULT_PERIOD = '1y';

export default function TradingDashboard() {
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);

  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [backtest, setBacktest] = useState<BacktestResponse | null>(null);

  const [loadingDecision, setLoadingDecision] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loadingBacktest, setLoadingBacktest] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchMarketData = useCallback(async (t: string, p: string) => {
    setLoadingMarket(true);
    try {
      const res = await api.getMarketData(t, p);
      setMarketData(res.data);
    } catch (e) {
      // silently fail - price chart not critical
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  const fetchDecision = useCallback(async (t: string, p: string) => {
    setLoadingDecision(true);
    setError(null);
    try {
      const res = await api.getDecision(t, p);
      setDecision(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch decision';
      setError(msg);
    } finally {
      setLoadingDecision(false);
    }
  }, []);

  const fetchBacktest = useCallback(async (t: string) => {
    setLoadingBacktest(true);
    try {
      const res = await api.getBacktest(t, '2y', 100000);
      setBacktest(res);
    } catch {
      // non-critical
    } finally {
      setLoadingBacktest(false);
    }
  }, []);

  const runAnalysis = useCallback(async (t: string, p: string) => {
    await Promise.all([
      fetchMarketData(t, p),
      fetchDecision(t, p),
    ]);
  }, [fetchMarketData, fetchDecision]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Check backend health
      try {
        await api.health();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
        setInitializing(false);
        return;
      }

      await runAnalysis(DEFAULT_TICKER, DEFAULT_PERIOD);
      setInitializing(false);
    };
    init();
  }, []);  // eslint-disable-line

  const handleTickerChange = (t: string) => {
    setTicker(t);
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
  };

  const handleAnalyze = useCallback(() => {
    setDecision(null);
    setMarketData([]);
    setBacktest(null);
    runAnalysis(ticker, period);
  }, [ticker, period, runAnalysis]);

  const handleRunBacktest = useCallback(() => {
    fetchBacktest(ticker);
  }, [ticker, fetchBacktest]);

  if (!backendOnline) return <BackendOffline />;

  return (
    <div className="min-h-screen bg-bg grid-bg">
      <Header
        ticker={ticker}
        onTickerChange={handleTickerChange}
        onAnalyze={handleAnalyze}
        isLoading={loadingDecision}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      <StatsBar
        marketData={marketData}
        decision={decision}
        ticker={ticker}
      />

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {initializing ? (
          <FullPageLoader ticker={ticker} />
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <ErrorBanner message={error} onRetry={handleAnalyze} />
              </div>
            )}

            {/* ── Layout grid ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* Left col: Price chart + Reasoning */}
              <div className="col-span-12 xl:col-span-8 space-y-4">
                <PriceChart
                  data={marketData}
                  ticker={ticker}
                  isLoading={loadingMarket}
                />
                <ReasoningPanel
                  data={decision}
                  isLoading={loadingDecision}
                />
                <BacktestPanel
                  data={backtest}
                  isLoading={loadingBacktest}
                  onRun={handleRunBacktest}
                />
              </div>

              {/* Right col: Decision + Predictions + Regime */}
              <div className="col-span-12 xl:col-span-4 space-y-4">
                <DecisionCard
                  data={decision}
                  isLoading={loadingDecision}
                />
                <PredictionsPanel
                  data={decision}
                  isLoading={loadingDecision}
                />
                <MarketRegime
                  marketData={marketData}
                  decision={decision}
                  isLoading={loadingMarket || loadingDecision}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
              <div className="font-mono text-[10px] text-muted">
                ALGOTRADER AI v1.0 · ML: XGBoost + LSTM · Agents: Technical, Sentiment, Volatility · Data: Yahoo Finance
              </div>
              <div className="font-mono text-[10px] text-muted">
                ⚠ For educational purposes only. Not financial advice.
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
