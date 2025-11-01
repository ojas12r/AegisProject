import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPct(n: number, decimals = 2): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatNumber(n, decimals)}%`;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function decisionColor(decision: string): string {
  switch (decision) {
    case 'BUY':  return '#00ff88';
    case 'SELL': return '#ff3b5c';
    default:     return '#ffd700';
  }
}

export function decisionBg(decision: string): string {
  switch (decision) {
    case 'BUY':  return 'rgba(0, 255, 136, 0.1)';
    case 'SELL': return 'rgba(255, 59, 92, 0.1)';
    default:     return 'rgba(255, 215, 0, 0.1)';
  }
}

export function regimeColor(regime: string): string {
  switch (regime) {
    case 'LOW_VOLATILITY':    return '#00ff88';
    case 'NORMAL':            return '#00e5ff';
    case 'HIGH_VOLATILITY':   return '#ffd700';
    case 'EXTREME_VOLATILITY':return '#ff3b5c';
    default:                  return '#c8d8e4';
  }
}

export function truncateDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
