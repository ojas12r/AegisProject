'use client';

import { DecisionResponse, MarketDataPoint } from '@/lib/api';
import { cn, formatPct, formatCurrency } from '@/lib/utils';

interface StatsBarProps {
  marketData: MarketDataPoint[];
  decision: DecisionResponse | null;
  ticker: string;
}

export function StatsBar({ marketData, decision, ticker }: StatsBarProps) {
  if (!marketData.length) return null;

  const latest = marketData[marketData.length - 1];
  const prev = marketData[marketData.length - 2];
  const weekAgo = marketData[Math.max(0, marketData.length - 6)];
  const monthAgo = marketData[Math.max(0, marketData.length - 22)];

  const dayChange = prev ? ((latest.Close - prev.Close) / prev.Close) * 100 : 0;
  const weekChange = weekAgo ? ((latest.Close - weekAgo.Close) / weekAgo.Close) * 100 : 0;
  const monthChange = monthAgo ? ((latest.Close - monthAgo.Close) / monthAgo.Close) * 100 : 0;

  const stats = [
    { label: '52W HIGH', value: `$${Math.max(...marketData.map(d => d.High)).toFixed(2)}`, neutral: true },
    { label: '52W LOW', value: `$${Math.min(...marketData.map(d => d.Low)).toFixed(2)}`, neutral: true },
    { label: '1D', value: formatPct(dayChange), positive: dayChange >= 0 },
    { label: '1W', value: formatPct(weekChange), positive: weekChange >= 0 },
    { label: '1M', value: formatPct(monthChange), positive: monthChange >= 0 },
    {
      label: 'RSI',
      value: latest.RSI ? latest.RSI.toFixed(1) : '—',
      positive: latest.RSI ? latest.RSI < 50 : null,
      neutral: !latest.RSI,
    },
    {
      label: 'VOL / AVG',
      value: decision?.analysis?.sentiment?.volume_ratio
        ? `${decision.analysis.sentiment.volume_ratio.toFixed(2)}x`
        : '—',
      neutral: true,
    },
    {
      label: 'REGIME',
      value: decision?.analysis?.volatility?.regime_label ?? '—',
      neutral: true,
    },
  ];

  return (
    <div className="border-b border-border bg-surface/60 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex items-center gap-6 overflow-x-auto">
        <div className="font-mono text-xs text-muted flex-shrink-0 mr-2">
          <span className="text-accent font-semibold">{ticker}</span>
        </div>
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-mono text-muted">{s.label}</span>
            <span className={cn(
              "text-xs font-mono tabular-nums font-medium",
              s.neutral ? "text-text" : s.positive ? "text-green" : "text-red"
            )}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
