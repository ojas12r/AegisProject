'use client';

import { DecisionResponse } from '@/lib/api';
import { cn, decisionColor, decisionBg, regimeColor } from '@/lib/utils';
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface DecisionCardProps {
  data: DecisionResponse | null;
  isLoading: boolean;
}

export function DecisionCard({ data, isLoading }: DecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="skeleton h-5 w-24 rounded mb-4" />
        <div className="skeleton h-24 w-full rounded-lg mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { decision, confidence, weighted_score, signal_breakdown, regime, risk_level } = data.decision;
  const color = decisionColor(decision);
  const bg = decisionBg(decision);

  const DecisionIcon = decision === 'BUY' ? TrendingUp : decision === 'SELL' ? TrendingDown : Minus;

  return (
    <div className="bg-card border border-border rounded-xl p-6 fade-slide-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted tracking-wider">DECISION ENGINE</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: color }} />
          <span className="text-xs font-mono" style={{ color }}>ACTIVE</span>
        </div>
      </div>

      {/* Main decision */}
      <div
        className={cn(
          "rounded-xl p-5 mb-5 text-center border relative overflow-hidden",
          decision === 'BUY' ? 'decision-buy' : decision === 'SELL' ? 'decision-sell' : ''
        )}
        style={{ background: bg, borderColor: color + '40' }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
        />
        <DecisionIcon className="w-8 h-8 mx-auto mb-2" style={{ color }} />
        <div className="font-display font-bold text-5xl" style={{ color }}>
          {decision}
        </div>
        <div className="font-mono text-xs text-muted mt-1">FINAL SIGNAL</div>
      </div>

      {/* Confidence meter */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-muted">CONFIDENCE</span>
          <span className="font-mono font-semibold text-sm tabular-nums" style={{ color }}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${confidence}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
            }}
          />
        </div>
      </div>

      {/* Weighted score */}
      <div className="flex items-center justify-between mb-5 p-3 bg-surface/50 rounded-lg">
        <span className="text-xs font-mono text-muted">WEIGHTED SCORE</span>
        <span className="font-mono text-sm tabular-nums" style={{ color: weighted_score > 0 ? '#00ff88' : weighted_score < 0 ? '#ff3b5c' : '#ffd700' }}>
          {weighted_score > 0 ? '+' : ''}{weighted_score.toFixed(4)}
        </span>
      </div>

      {/* Signal breakdown */}
      <div className="space-y-2.5 mb-5">
        <div className="text-xs font-mono text-muted mb-3">SIGNAL BREAKDOWN</div>
        {Object.entries(signal_breakdown).map(([source, info]) => {
          const pct = Math.abs(info.score) * 100;
          const isPos = info.score > 0;
          const isNeg = info.score < 0;
          return (
            <div key={source} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted w-20 flex-shrink-0 uppercase">{source}</span>
              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isPos ? '#00ff88' : isNeg ? '#ff3b5c' : '#ffd700',
                    marginLeft: isNeg ? 'auto' : undefined,
                  }}
                />
              </div>
              <span className={cn(
                "text-xs font-mono w-12 text-right tabular-nums",
                info.score > 0 ? "text-green" : info.score < 0 ? "text-red" : "text-gold"
              )}>
                {info.score > 0 ? 'BUY' : info.score < 0 ? 'SELL' : 'HOLD'}
              </span>
              <span className="text-xs font-mono text-muted w-10 text-right">
                {(info.weight * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Risk indicator */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/50">
        {risk_level === 'HIGH' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-gold flex-shrink-0" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-green flex-shrink-0" />
        )}
        <div>
          <span className="text-xs font-mono text-muted">REGIME: </span>
          <span className="text-xs font-mono" style={{ color: regimeColor(regime) }}>
            {regime.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
