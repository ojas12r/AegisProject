'use client';

import { DecisionResponse } from '@/lib/api';
import { cn, formatPct, formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Brain, GitBranch } from 'lucide-react';

interface PredictionsProps {
  data: DecisionResponse | null;
  isLoading: boolean;
}

export function PredictionsPanel({ data, isLoading }: PredictionsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="skeleton h-5 w-28 rounded mb-4" />
            <div className="skeleton h-12 w-full rounded mb-3" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { xgboost, lstm, feature_importance } = data.predictions;

  const forecastData = lstm.forecast_5d.map((price, i) => ({
    day: `D+${i + 1}`,
    price: Number(price.toFixed(2)),
  }));

  const currentPoint = { day: 'NOW', price: lstm.current_price };

  return (
    <div className="space-y-4">
      {/* XGBoost Card */}
      <div className={cn(
        "bg-card border rounded-xl p-5 fade-slide-up",
        xgboost.direction === 'BUY' ? 'border-green/20' : 'border-red/20'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted tracking-wider">XGBOOST MODEL</span>
          </div>
          <span className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded",
            xgboost.direction === 'BUY' ? "bg-green/10 text-green" : "bg-red/10 text-red"
          )}>
            {xgboost.direction}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-[10px] font-mono text-muted mb-1">RETURN PRED.</div>
            <div className={cn(
              "font-mono font-semibold text-xl tabular-nums",
              xgboost.return_prediction >= 0 ? "text-green" : "text-red"
            )}>
              {formatPct(xgboost.return_prediction)}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-[10px] font-mono text-muted mb-1">CONFIDENCE</div>
            <div className="font-mono font-semibold text-xl tabular-nums text-white">
              {xgboost.direction_confidence.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xgboost.direction_confidence}%`,
                background: xgboost.direction === 'BUY'
                  ? 'linear-gradient(90deg, #00ff8888, #00ff88)'
                  : 'linear-gradient(90deg, #ff3b5c88, #ff3b5c)',
              }}
            />
          </div>
        </div>
      </div>

      {/* LSTM Card */}
      <div className={cn(
        "bg-card border rounded-xl p-5 fade-slide-up",
        lstm.direction === 'BUY' ? 'border-green/20' : 'border-red/20'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted tracking-wider">LSTM MODEL</span>
          </div>
          <span className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded",
            lstm.direction === 'BUY' ? "bg-green/10 text-green" : "bg-red/10 text-red"
          )}>
            {lstm.direction}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-[10px] font-mono text-muted mb-1">PRED. PRICE</div>
            <div className="font-mono font-semibold text-lg tabular-nums text-white">
              {formatCurrency(lstm.predicted_price)}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-[10px] font-mono text-muted mb-1">CHANGE</div>
            <div className={cn(
              "font-mono font-semibold text-lg tabular-nums",
              lstm.price_change_pct >= 0 ? "text-green" : "text-red"
            )}>
              {formatPct(lstm.price_change_pct)}
            </div>
          </div>
        </div>

        {/* 5-day forecast mini chart */}
        <div>
          <div className="text-[10px] font-mono text-muted mb-2">5-DAY FORECAST</div>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={[currentPoint, ...forecastData]} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                dataKey="price"
                stroke={lstm.direction === 'BUY' ? '#00ff88' : '#ff3b5c'}
                strokeWidth={2}
                dot={{ r: 3, fill: lstm.direction === 'BUY' ? '#00ff88' : '#ff3b5c', strokeWidth: 0 }}
                strokeDasharray={lstm.direction === 'BUY' ? undefined : undefined}
              />
              <XAxis dataKey="day" tick={{ fill: '#4a6070', fontSize: 9, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
                contentStyle={{ background: '#111820', border: '1px solid #1e2a35', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                labelStyle={{ color: '#4a6070' }}
                itemStyle={{ color: '#c8d8e4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance */}
      {feature_importance?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
          <div className="text-xs font-mono text-muted tracking-wider mb-4">FEATURE IMPORTANCE (XGB)</div>
          <div className="space-y-2">
            {feature_importance.slice(0, 8).map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted w-28 flex-shrink-0 truncate">{f.feature}</span>
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${f.importance}%`,
                      background: `hsl(${200 - i * 15}, 80%, 55%)`,
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted tabular-nums w-10 text-right">
                  {f.importance.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
