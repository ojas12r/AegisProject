'use client';

import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { MarketDataPoint } from '@/lib/api';
import { truncateDate, formatCurrency, cn } from '@/lib/utils';
import { useState } from 'react';

interface PriceChartProps {
  data: MarketDataPoint[];
  ticker: string;
  isLoading: boolean;
}

type Overlay = 'ema21' | 'ema50' | 'bb' | 'none';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-2xl font-mono text-xs">
      <div className="text-muted mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="text-white">{typeof p.value === 'number' ? `$${p.value.toFixed(2)}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function PriceChart({ data, ticker, isLoading }: PriceChartProps) {
  const [overlay, setOverlay] = useState<Overlay>('ema21');
  const [showVolume, setShowVolume] = useState(false);

  const chartData = data.slice(-120).map(d => ({
    date: truncateDate(d.Date),
    price: Number(d.Close.toFixed(2)),
    ema21: Number((d.EMA_21 || 0).toFixed(2)),
    ema50: Number((d.EMA_50 || 0).toFixed(2)),
    bbUpper: Number((d.BB_Upper || 0).toFixed(2)),
    bbLower: Number((d.BB_Lower || 0).toFixed(2)),
    volume: d.Volume,
  }));

  if (isLoading || !data.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-8 w-48 rounded" />
        </div>
        <div className="skeleton h-64 w-full rounded" />
      </div>
    );
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = latest && prev ? ((latest.Close - prev.Close) / prev.Close) * 100 : 0;

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;

  return (
    <div className="bg-card border border-border rounded-xl p-6 fade-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-2xl text-white">{ticker}</span>
            <span className={cn(
              "text-sm font-mono px-2 py-0.5 rounded",
              change >= 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"
            )}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </span>
          </div>
          <div className="font-mono text-3xl font-semibold text-white mt-1 tabular-nums">
            {latest ? formatCurrency(latest.Close) : '—'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-muted mr-2">OVERLAY:</div>
          {[
            { key: 'none', label: 'NONE' },
            { key: 'ema21', label: 'EMA' },
            { key: 'bb', label: 'BB' },
          ].map(o => (
            <button
              key={o.key}
              onClick={() => setOverlay(o.key as Overlay)}
              className={cn(
                "text-[10px] font-mono px-2 py-1 rounded transition-colors",
                overlay === o.key ? "bg-accent/20 text-accent border border-accent/30" : "text-muted hover:text-text"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffd700" stopOpacity={0.05} />
              <stop offset="95%" stopColor="#ffd700" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="2 4" stroke="#1e2a35" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#4a6070', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#4a6070', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v.toFixed(0)}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Bollinger Bands */}
          {overlay === 'bb' && (
            <>
              <Area dataKey="bbUpper" stroke="#ffd700" strokeWidth={1} fill="url(#bbGrad)" strokeDasharray="3 3" name="BB Upper" dot={false} />
              <Area dataKey="bbLower" stroke="#ffd700" strokeWidth={1} fill="transparent" strokeDasharray="3 3" name="BB Lower" dot={false} />
            </>
          )}

          {/* EMAs */}
          {overlay === 'ema21' && (
            <>
              <Line dataKey="ema21" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="EMA 21" opacity={0.7} />
              <Line dataKey="ema50" stroke="#ffd700" strokeWidth={1.5} dot={false} name="EMA 50" opacity={0.7} />
            </>
          )}

          {/* Price */}
          <Area
            dataKey="price"
            stroke="#00e5ff"
            strokeWidth={2}
            fill="url(#priceGrad)"
            name="Price"
            dot={false}
            activeDot={{ r: 4, fill: '#00e5ff', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
