import type { BookingStatus } from '@/api/bookings';

import type { CmsStatusMeta } from '../components';

const STATUS_META: Record<BookingStatus, CmsStatusMeta> = {
  pending: { label: 'Pending', color: '#D97706', kind: 'warning' },
  confirmed: { label: 'Confirmed', color: '#16A34A', kind: 'success' },
  cancelled: { label: 'Cancelled', color: '#DC2626', kind: 'danger' },
};

export function getBookingStatusMeta(status: BookingStatus | string): CmsStatusMeta {
  return STATUS_META[status as BookingStatus] ?? { label: status || 'N/A', color: '#94A3B8', kind: 'info' };
}

export function fmtDateTime(d?: string): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function fmtTime(d?: string): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function sameDay(a?: string, b?: Date): boolean {
  if (!a || !b) return false;
  const dateA = new Date(a);
  if (isNaN(dateA.getTime())) return false;
  return dateA.toDateString() === b.toDateString();
}
