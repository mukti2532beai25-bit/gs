// Format currency in INR
export function formatCurrency(amount: number | null | undefined, currency = 'INR'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

// Format date from ISO or YYYY-MM-DD
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

// Format relative time
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(isoDate);
}

// Confidence to percentage
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// Confidence to color class
export function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-emerald-400';
  if (confidence >= 0.75) return 'text-cyan-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

// Status label map
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  extracted: 'Extracted',
  reviewed: 'Reviewed',
  approved: 'Approved',
  exported: 'Exported',
};

// Language label map
export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी',
  pa: 'ਪੰਜਾਬੀ',
};

// Clamp number
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

// Truncate text
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '…';
}

// Download blob as file
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
