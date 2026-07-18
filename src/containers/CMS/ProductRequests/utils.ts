import type { ProductRequestStatus } from '@/api/product-requests';

import type { CmsStatusMeta } from '../components';

const STATUS_META: Record<ProductRequestStatus, CmsStatusMeta> = {
  PENDING: { label: 'Pending', color: '#D97706', kind: 'warning' },
  APPROVED: { label: 'Approved', color: '#16A34A', kind: 'success' },
  REJECTED: { label: 'Rejected', color: '#DC2626', kind: 'danger' },
};

export function getProductRequestStatusMeta(status: ProductRequestStatus | string): CmsStatusMeta {
  return STATUS_META[status as ProductRequestStatus] ?? { label: status || 'N/A', color: '#94A3B8', kind: 'info' };
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}
