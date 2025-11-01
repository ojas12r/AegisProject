'use client';

import { useState } from 'react';
import { Activity, Search, Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ', 'BTC-USD'];

interface HeaderProps {
  ticker: string;
  onTickerChange: (ticker: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
}

const PERIODS = ['3mo', '6mo', '1y', '2y', '5y'];

export function Header({ ticker, onTickerChange, onAnalyze, isLoading, period, onPeriodChange }: HeaderProps) {
  const [input, setInput] = useState(ticker);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onTickerChange(input.trim().toUpperCase());
      onAnalyze();
    }
  };

  const selectTicker = (t: string) => {
    setInput(t);
    onTickerChange(t);
    setShowDropdown(false);
    onAnalyze();
  };

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      {/* Ticker tape */}
      <div className="border-b border-border/50 py-1 ticker-wrap bg-bg/60">
        <div className="ticker-content text-xs font-mono text-muted">
          {[...POPULAR_TICKERS, ...POPULAR_TICKERS].map((t, i) => (
            <span key={i} className="inline-block mr-8">
              <span className="text-accent/70">{t}</span>
              <span className="ml-2 text-green/60">+{(Math.random() * 3).toFixed(2)}%</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Activity className="w-6 h-6 text-accent" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green pulse-dot" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm tracking-wide">ALGOTRADER</div>
            <div className="font-mono text-[9px] text-muted tracking-widest">AI QUANT SYSTEM v1.0</div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl relative">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:border-accent/50 transition-colors">
            <Search className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="bg-transparent font-mono text-sm text-white outline-none flex-1 placeholder:text-muted"
              placeholder="Enter ticker symbol..."
              maxLength={10}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent text-xs font-mono px-3 py-1 rounded hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              {isLoading ? 'ANALYZING...' : 'ANALYZE'}
            </button>
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-2xl z-50">
              <div className="p-2">
                <div className="text-[10px] font-mono text-muted px-2 py-1">POPULAR TICKERS</div>
                <div className="grid grid-cols-5 gap-1">
                  {POPULAR_TICKERS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => selectTicker(t)}
                      className={cn(
                        "text-xs font-mono px-2 py-1.5 rounded text-left transition-colors",
                        t === ticker ? "bg-accent/20 text-accent" : "text-muted hover:bg-surface hover:text-text"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Period selector */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                "text-xs font-mono px-3 py-1.5 rounded transition-colors",
                p === period
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-muted hover:text-text"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
          <span className="text-xs font-mono text-muted">LIVE</span>
        </div>
      </div>
    </header>
  );
}
