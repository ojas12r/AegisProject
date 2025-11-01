'use client';

import { DecisionResponse } from '@/lib/api';
import { cn, decisionColor } from '@/lib/utils';
import { ChevronDown, ChevronUp, BarChart2, MessageSquare, Activity, Cpu } from 'lucide-react';
import { useState } from 'react';

interface ReasoningPanelProps {
  data: DecisionResponse | null;
  isLoading: boolean;
}

function AgentBlock({
  title,
  icon: Icon,
  decision,
  confidence,
  reasoning,
  summary,
  extra,
  accentColor,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  decision: string;
  confidence: number;
  reasoning: string[];
  summary: string;
  extra?: React.ReactNode;
  accentColor: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: open ? accentColor + '40' : '#1e2a35' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accentColor + '15' }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="text-xs font-mono text-muted tracking-wider">{title}</div>
            <div className="font-display font-semibold text-sm text-white mt-0.5">{summary.slice(0, 60)}…</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <div className="text-right">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ color: decisionColor(decision), background: decisionColor(decision) + '15' }}
            >
              {decision}
            </span>
            <div className="text-[10px] font-mono text-muted mt-0.5 text-right">{confidence.toFixed(0)}% conf.</div>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: accentColor + '20', background: accentColor + '05' }}>
          <div className="text-xs font-mono text-muted mb-3 tracking-wider">CHAIN-OF-THOUGHT REASONING</div>
          <div className="space-y-2.5">
            {reasoning.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold flex-shrink-0 mt-0.5"
                  style={{ background: accentColor + '20', color: accentColor }}
                >
                  {i + 1}
                </div>
                <p className="text-xs font-mono text-text/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          {extra && <div className="mt-4">{extra}</div>}
        </div>
      )}
    </div>
  );
}

export function ReasoningPanel({ data, isLoading }: ReasoningPanelProps) {
  const [showCot, setShowCot] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="skeleton h-5 w-40 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { technical, sentiment, volatility } = data.analysis;
  const cotReasons = data.decision.cot_reasoning;

  return (
    <div className="bg-card border border-border rounded-xl p-5 fade-slide-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted tracking-wider">MULTI-AGENT REASONING</span>
        <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded">MPF CoT</span>
      </div>

      <div className="space-y-2">
        {/* Technical Agent */}
        <AgentBlock
          title="TECHNICAL ANALYSIS AGENT"
          icon={BarChart2}
          decision={technical.decision}
          confidence={technical.confidence}
          reasoning={technical.reasoning}
          summary={technical.summary}
          accentColor="#00e5ff"
          defaultOpen={true}
          extra={
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.entries(technical.indicators).map(([k, v]) => (
                <div key={k} className="bg-surface/60 rounded p-2">
                  <div className="text-[9px] font-mono text-muted">{k}</div>
                  <div className="text-xs font-mono text-white tabular-nums">{Number(v).toFixed(3)}</div>
                </div>
              ))}
            </div>
          }
        />

        {/* Sentiment Agent */}
        <AgentBlock
          title="MARKET SENTIMENT AGENT"
          icon={MessageSquare}
          decision={sentiment.decision}
          confidence={sentiment.confidence}
          reasoning={sentiment.reasoning}
          summary={sentiment.summary}
          accentColor="#ffd700"
          extra={
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: 'SENTIMENT', value: sentiment.sentiment_score?.toFixed(1) + '/100' },
                { label: 'VOL RATIO', value: sentiment.volume_ratio?.toFixed(2) + 'x' },
                { label: 'NEWS', value: (sentiment.news_sentiment * 100)?.toFixed(1) + '%' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface/60 rounded p-2">
                  <div className="text-[9px] font-mono text-muted">{label}</div>
                  <div className="text-xs font-mono text-white tabular-nums">{value}</div>
                </div>
              ))}
            </div>
          }
        />

        {/* Volatility Agent */}
        <AgentBlock
          title="VOLATILITY & REGIME AGENT"
          icon={Activity}
          decision={volatility.decision}
          confidence={volatility.confidence}
          reasoning={volatility.reasoning}
          summary={volatility.summary}
          accentColor="#ff3b5c"
          extra={
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: '10D VOL', value: volatility.metrics?.volatility_10d?.toFixed(1) + '%' },
                { label: '30D VOL', value: volatility.metrics?.volatility_30d?.toFixed(1) + '%' },
                { label: 'BB WIDTH', value: volatility.metrics?.bb_width?.toFixed(2) + '%' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface/60 rounded p-2">
                  <div className="text-[9px] font-mono text-muted">{label}</div>
                  <div className="text-xs font-mono text-white tabular-nums">{value}</div>
                </div>
              ))}
            </div>
          }
        />
      </div>

      {/* Full CoT Aggregator */}
      <div className="mt-3">
        <button
          onClick={() => setShowCot(o => !o)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-border hover:border-accent/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted">AGGREGATOR CoT TRACE</span>
          </div>
          {showCot ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </button>

        {showCot && (
          <div className="mt-2 p-4 bg-surface/30 rounded-xl border border-accent/10">
            <div className="space-y-2">
              {cotReasons.map((line, i) => {
                const isAggregator = line.includes('[Aggregator]');
                return (
                  <div key={i} className={cn("font-mono text-xs leading-relaxed", isAggregator ? "text-accent font-semibold" : "text-text/70")}>
                    <span className="text-muted mr-1">{String(i + 1).padStart(2, '0')}.</span>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
