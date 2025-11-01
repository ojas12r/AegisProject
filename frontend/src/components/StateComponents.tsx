'use client';

import { AlertCircle, RefreshCw, Server } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red/5 border border-red/20 rounded-xl font-mono text-xs">
      <AlertCircle className="w-4 h-4 text-red flex-shrink-0" />
      <span className="text-red/80 flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-red/60 hover:text-red transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

export function BackendOffline() {
  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center">
        <Server className="w-10 h-10 text-muted mx-auto mb-4" />
        <h2 className="font-display text-xl text-white mb-2">Backend Offline</h2>
        <p className="text-sm font-mono text-muted mb-6">
          The FastAPI backend is not reachable at{' '}
          <span className="text-accent">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</span>
        </p>
        <div className="text-left bg-surface rounded-xl p-4 font-mono text-xs text-muted space-y-1">
          <div className="text-muted/60 mb-2"># Start the backend:</div>
          <div><span className="text-accent">cd</span> backend</div>
          <div><span className="text-accent">pip install</span> -r requirements.txt</div>
          <div><span className="text-accent">uvicorn</span> main:app --reload</div>
        </div>
      </div>
    </div>
  );
}

export function FullPageLoader({ ticker }: { ticker: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-accent/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-accent/20 animate-pulse" />
        </div>
        <div className="font-mono text-sm text-muted">Analyzing <span className="text-accent">{ticker}</span></div>
        <div className="font-mono text-xs text-muted/50 mt-1">Running ML models + agent reasoning…</div>
      </div>
    </div>
  );
}
