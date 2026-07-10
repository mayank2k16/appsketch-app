import type { SalesRangeOption, SalesRangeValue } from '@/api/analytics';

export function toNumber(v: number | string | undefined | null): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function inr(v: number | string | undefined | null): string {
  return `₹${toNumber(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Compact form for chart axis labels — ₹12k / ₹1.4L instead of the full
 * grouped number, which would overflow a narrow mobile axis. */
export function inrCompact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toFixed(0)}`;
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export const SALES_RANGE_OPTIONS: SalesRangeOption[] = [
  { label: 'Past 7 Days', value: '7' },
  { label: 'Past 15 Days', value: '15' },
  { label: 'Past Month', value: '30' },
  { label: 'Past 6 Months', value: '180' },
  { label: 'Past Year', value: '365' },
  { label: 'All Time', value: '99999' },
];

export function getRangeMetaText(range: SalesRangeValue): string {
  switch (range) {
    case '7':
      return 'Compared to previous 7 days';
    case '15':
      return 'Compared to previous 15 days';
    case '30':
      return 'Compared to previous 30 days';
    case '180':
      return 'Compared to previous 6 months';
    case '365':
      return 'Compared to previous year';
    case '99999':
      return 'All-time totals';
    default:
      return 'Compared to last period';
  }
}

/** Fixed categorical palette for pie/donut series — deliberately not tied to
 * the active CMS accent color, since a multi-series chart needs several
 * distinct hues regardless of which single-color theme is selected. */
export const PIE_PALETTE = ['#287F71', '#EB862A', '#ABBDD3', '#7C3AED', '#97A3B6', '#DC2626'];

const REFERRER_ICON_MAP: { match: string; icon: string }[] = [
  { match: 'google', icon: 'logo-google' },
  { match: 'facebook', icon: 'logo-facebook' },
  { match: 'instagram', icon: 'logo-instagram' },
  { match: 'twitter', icon: 'logo-twitter' },
  { match: 't.co', icon: 'logo-twitter' },
  { match: 'x.com', icon: 'logo-twitter' },
  { match: 'linkedin', icon: 'logo-linkedin' },
  { match: 'youtube', icon: 'logo-youtube' },
];

export function getReferrerIcon(referrer: string): string {
  const lower = referrer.toLowerCase();
  return REFERRER_ICON_MAP.find((entry) => lower.includes(entry.match))?.icon ?? 'globe-outline';
}
