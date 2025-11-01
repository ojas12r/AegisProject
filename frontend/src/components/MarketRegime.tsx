'use client';

import { MarketDataPoint } from '@/lib/api';
import { DecisionResponse } from '@/lib/api';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { regimeColor, truncateDate, cn } from '@/lib/utils';
import { Gauge } from 'lucide-react';

interface MarketRegimeProps {
  marketData: MarketDataPoint[];
  decision: DecisionResponse | null;
  isLoading: boolean;
}

const REGIME_LABELS: Record<string, { label: string; desc: string }> = {
  LOW_VOLATILITY: { label: 'Low Vol', desc: 'Trending conditions. Strategy favorable.' },
  NORMAL: { label: 'Normal', desc: 'Standard conditions. Full position sizing.' },
  HIGH_VOLATILITY: { label: 'High Vol', desc: 'Elevated risk. Reduce exposure 30-50%.' },
  EXTREME_VOLATILITY: { label: 'Extreme', desc: 'Crisis-level vol. Hedge or exit.' },
};

const miniTooltip = {
  contentStyle: {
    background: '#111820',
    border: '1px solid #1e2a35',
    fontSize: 10,
    fontFamily: 'IBM Plex Mono',
    borderRadius: 6,
  },
  labelStyle: { color: '#4a6070' },
  itemStyle: { color: '#c8d8e4' },
};

export function MarketRegime({ marketData, decision, isLoading }: MarketRegimeProps) {
  if (isLoading || !marketData.length) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  const recent = marketData.slice(-80);

  const rsiData = recent.map(d => ({
    date: truncateDate(d.Date),
    rsi: Number((d.RSI || 50).toFixed(2)),
  }));

  const macdData = recent.map(d => ({
    date: truncateDate(d.Date),
    macd: Number((d.MACD || 0).toFixed(4)),
    signal: Number((d.MACD_Signal || 0).toFixed(4)),
    hist: Number(((d.MACD || 0) - (d.MACD_Signal || 0)).toFixed(4)),
  }));

  const regime = decision?.analysis?.volatility?.regime ?? 'NORMAL';
  const regimeInfo = REGIME_LABELS[regime] ?? REGIME_LABELS.NORMAL;
  const rColor = regimeColor(regime);

  const latestRsi = rsiData[rsiData.length - 1]?.rsi ?? 50;
  const rsiAngle = ((latestRsi - 0) / 100) * 180 - 90; // -90 to +90

  const volMetrics = decision?.analysis?.volatility?.metrics;

  return (
    <div className="space-y-4">
      {/* Regime Card */}
      <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-muted tracking-wider">MARKET REGIME</span>
          <Gauge className="w-4 h-4 text-muted" />
        </div>

        <div className="flex items-center gap-4 mb-3">
          {/* Regime orb */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative"
            style={{ background: rColor + '15', border: `2px solid ${rColor}40` }}
          >
            <div className="w-4 h-4 rounded-full pulse-dot" style={{ background: rColor }} />
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 20px ${rColor}30` }}
            />
          </div>
          <div>
            <div className="font-display font-bold text-xl" style={{ color: rColor }}>
              {regimeInfo.label}
            </div>
            <div className="text-xs font-mono text-muted mt-0.5">{regimeInfo.desc}</div>
          </div>
        </div>

        {/* Vol metrics */}
        {volMetrics && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: '10D REALIZED VOL', value: volMetrics.volatility_10d?.toFixed(1) + '%', color: regimeColor(regime) },
              { label: '30D REALIZED VOL', value: volMetrics.volatility_30d?.toFixed(1) + '%', color: '#c8d8e4' },
              { label: 'ATR %', value: volMetrics.atr_pct?.toFixed(3) + '%', color: '#c8d8e4' },
              { label: 'VOL PERCENTILE', value: volMetrics.vol_percentile?.toFixed(0) + 'th', color: regimeColor(regime) },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface/50 rounded-lg p-2.5">
                <div className="text-[9px] font-mono text-muted">{label}</div>
                <div className="font-mono text-sm tabular-nums mt-0.5" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RSI Chart */}
      <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-muted tracking-wider">RSI (14)</span>
          <span className={cn(
            "font-mono text-sm tabular-nums font-semibold",
            latestRsi < 30 ? "text-green" : latestRsi > 70 ? "text-red" : "text-accent"
          )}>
            {latestRsi.toFixed(1)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={rsiData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGridMinimal />
            <ReferenceLine y={70} stroke="#ff3b5c" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
            <ReferenceLine y={30} stroke="#00ff88" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} tick={{ fill: '#4a6070', fontSize: 9, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number) => [v.toFixed(1), 'RSI']}
              {...miniTooltip}
            />
            <Area dataKey="rsi" stroke="#00e5ff" strokeWidth={1.5} fill="url(#rsiGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-between mt-1">
          <span className="text-[9px] font-mono text-green">OVERSOLD ← 30</span>
          <span className="text-[9px] font-mono text-red">70 → OVERBOUGHT</span>
        </div>
      </div>

      {/* MACD Chart */}
      <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-muted tracking-wider">MACD (12,26,9)</span>
          <div className="flex gap-3">
            <span className="text-[9px] font-mono text-accent">─ MACD</span>
            <span className="text-[9px] font-mono text-gold">─ Signal</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={macdData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
            <ReferenceLine y={0} stroke="#1e2a35" strokeWidth={1} />
            <XAxis dataKey="date" hide />
            <YAxis tick={{ fill: '#4a6070', fontSize: 9, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number, n: string) => [v.toFixed(4), n]}
              {...miniTooltip}
            />
            <Line dataKey="macd" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="MACD" />
            <Line dataKey="signal" stroke="#ffd700" strokeWidth={1.5} dot={false} name="Signal" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Minimal grid for sub-charts
function CartesianGridMinimal() {
  return (
    <g>
      <line x1="0%" y1="30%" x2="100%" y2="30%" stroke="#1e2a35" strokeWidth={0.5} />
      <line x1="0%" y1="70%" x2="100%" y2="70%" stroke="#1e2a35" strokeWidth={0.5} />
    </g>
  );
}
