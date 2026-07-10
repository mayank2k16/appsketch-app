import type { CmsStatusMeta } from '../../components';
import type { NotificationLogStatus } from '@/api/notifications';

const LOG_STATUS_META: Record<NotificationLogStatus, CmsStatusMeta> = {
  PENDING: { label: 'Pending', color: '#FF9800', kind: 'warning' },
  SENT: { label: 'Sent', color: '#4CAF50', kind: 'success' },
  FAILED: { label: 'Failed', color: '#F44336', kind: 'danger' },
  SKIPPED: { label: 'Skipped', color: '#94A3B8', kind: 'info' },
};

export function getLogStatusMeta(status: NotificationLogStatus | string): CmsStatusMeta {
  return LOG_STATUS_META[status as NotificationLogStatus] ?? { label: status, color: '#94A3B8', kind: 'info' };
}

export function formatLogDate(time: string): string {
  const d = new Date(time);
  return d.toLocaleString('default', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const LOG_STATUS_OPTIONS: { value: NotificationLogStatus; label: string }[] = (
  Object.keys(LOG_STATUS_META) as NotificationLogStatus[]
).map((value) => ({ value, label: LOG_STATUS_META[value].label }));
