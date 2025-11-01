'use client';

import { BacktestResponse } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn, formatCurrency, formatPct } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';

interface BacktestPanelProps {
  data: BacktestResponse | null;
  isLoading: boolean;
  onRun: () => void;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl font-mono text-xs">
      <div className="text-muted mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-muted">{p.name}:</span>
          <span className="text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  positive?: boolean | null;
  highlight?: boolean;
}

function Metric({ label, value, positive, highlight }: MetricProps) {
  const color = positive === null || positive === undefined
    ? 'text-white'
    : positive ? 'text-green' : 'text-red';

  return (
    <div className={cn(
      "bg-surface/60 rounded-lg p-3 border",
      highlight ? "border-accent/20" : "border-transparent"
    )}>
      <div className="text-[9px] font-mono text-muted tracking-wider mb-1">{label}</div>
      <div className={cn("font-mono font-semibold text-base tabular-nums", color)}>{value}</div>
    </div>
  );
}

export function BacktestPanel({ data, isLoading, onRun }: BacktestPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono text-muted tracking-wider">BACKTESTING ENGINE</span>
        </div>
        <button
          onClick={onRun}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent transition-colors disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          {isLoading ? 'RUNNING...' : 'RUN SIMULATION'}
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-48 w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart2 className="w-10 h-10 text-muted mb-3 opacity-40" />
          <div className="text-sm font-mono text-muted">Run a simulation to see backtesting results</div>
          <button
            onClick={onRun}
            className="mt-4 px-4 py-2 border border-accent/30 text-accent text-xs font-mono rounded-lg hover:bg-accent/10 transition-colors"
          >
            START BACKTEST
          </button>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Equity curve */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted">EQUITY CURVE vs INITIAL CAPITAL</span>
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span className="text-green">── Strategy</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={data.backtest.equity_curve}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2a35" vertical={false} />
                <ReferenceLine
                  y={data.backtest.metrics.initial_capital}
                  stroke="#4a6070"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4a6070', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#4a6070', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  dataKey="equity"
                  stroke="#00ff88"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                  name="Portfolio"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Metric
              label="TOTAL RETURN"
              value={formatPct(data.backtest.metrics.total_return)}
              positive={data.backtest.metrics.total_return >= 0}
              highlight
            />
            <Metric
              label="BUY & HOLD"
              value={formatPct(data.backtest.metrics.buy_hold_return)}
              positive={data.backtest.metrics.buy_hold_return >= 0}
            />
            <Metric
              label="SHARPE RATIO"
              value={data.backtest.metrics.sharpe_ratio.toFixed(3)}
              positive={data.backtest.metrics.sharpe_ratio >= 1}
            />
            <Metric
              label="MAX DRAWDOWN"
              value={formatPct(data.backtest.metrics.max_drawdown)}
              positive={false}
            />
            <Metric
              label="WIN RATE"
              value={`${data.backtest.metrics.win_rate.toFixed(1)}%`}
              positive={data.backtest.metrics.win_rate >= 50}
            />
            <Metric
              label="SORTINO"
              value={data.backtest.metrics.sortino_ratio.toFixed(3)}
              positive={data.backtest.metrics.sortino_ratio >= 1}
            />
          </div>

          {/* Alpha / Final capital */}
          <div className="flex items-center justify-between p-3 bg-surface/40 rounded-lg border border-border">
            <div>
              <div className="text-[9px] font-mono text-muted">FINAL CAPITAL</div>
              <div className="font-mono text-sm font-semibold text-white tabular-nums">
                {formatCurrency(data.backtest.metrics.final_capital)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-muted">ALPHA vs B&H</div>
              <div className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                data.backtest.metrics.alpha >= 0 ? "text-green" : "text-red"
              )}>
                {data.backtest.metrics.alpha >= 0 ? '+' : ''}{data.backtest.metrics.alpha.toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-muted">TOTAL TRADES</div>
              <div className="font-mono text-sm font-semibold text-white">
                {data.backtest.total_trades}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
