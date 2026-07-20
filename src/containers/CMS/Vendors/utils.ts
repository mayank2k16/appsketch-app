import type { VendorStatus } from '@/api/vendors';

import type { CmsStatusMeta } from '../components';

const STATUS_META: Record<VendorStatus, CmsStatusMeta> = {
  approved: { label: 'Approved', color: '#16A34A', kind: 'success' },
  pending: { label: 'Pending', color: '#D97706', kind: 'warning' },
  rejected: { label: 'Rejected', color: '#DC2626', kind: 'danger' },
};

export function getVendorStatusMeta(status: VendorStatus | string): CmsStatusMeta {
  return STATUS_META[status as VendorStatus] ?? { label: status || 'N/A', color: '#94A3B8', kind: 'info' };
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}
