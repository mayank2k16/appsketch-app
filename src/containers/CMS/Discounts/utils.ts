import type { CmsStatusMeta } from '../components';

export function formatDiscountDateTime(time?: string): string {
  if (!time) return 'N/A';
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formattedDate}, ${formattedTime}`;
}

export function getDiscountStatusMeta(isActive: boolean): CmsStatusMeta {
  return isActive
    ? { label: 'Active', color: '#4CAF50', kind: 'success' }
    : { label: 'Inactive', color: '#94A3B8', kind: 'info' };
}
