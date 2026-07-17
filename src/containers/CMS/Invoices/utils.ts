import type { CmsStatusMeta } from '../components';

export function formatInvoiceDate(time?: string): string {
  if (!time) return 'NA';
  const timestamp = new Date(time);
  if (Number.isNaN(timestamp.getTime())) return 'NA';
  const day = timestamp.getDate();
  const month = timestamp.toLocaleString('default', { month: 'short' });
  const year = timestamp.getFullYear();
  return `${day} ${month}, ${year}`;
}

/** Vite only ever distinguishes "Created" (green) from everything else
 * (amber) for invoice status — ported as the same two-state mapping rather
 * than inventing additional states the backend never actually sends. */
export function getInvoiceStatusMeta(status?: string): CmsStatusMeta {
  if (status === 'INVOICE_CREATED') {
    return { label: 'Created', color: '#4CAF50', kind: 'success' };
  }
  return { label: status || 'N/A', color: '#FF9800', kind: 'warning' };
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}
