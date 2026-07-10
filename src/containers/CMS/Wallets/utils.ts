import type { WalletTransactionSource, WalletTransactionStatus } from '@/api/wallets';

import type { CmsStatusMeta } from '../components';

export function inr(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return '₹0.00';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TRANSACTION_STATUS_META: Record<WalletTransactionStatus, CmsStatusMeta> = {
  SUCCESS: { label: 'Success', color: '#4CAF50', kind: 'success' },
  PENDING: { label: 'Pending', color: '#FF9800', kind: 'warning' },
  FAILED: { label: 'Failed', color: '#F44336', kind: 'danger' },
  REVERSED: { label: 'Reversed', color: '#94A3B8', kind: 'info' },
};

export function getTransactionStatusMeta(status: WalletTransactionStatus | string): CmsStatusMeta {
  return (
    TRANSACTION_STATUS_META[status as WalletTransactionStatus] ?? {
      label: status,
      color: '#94A3B8',
      kind: 'info',
    }
  );
}

export const TRANSACTION_SOURCE_LABEL: Record<WalletTransactionSource, string> = {
  RECHARGE: 'Recharge',
  ORDER_PAYMENT: 'Order Payment',
  ORDER_REFUND: 'Refund',
  REFERRAL_BONUS: 'Referral Bonus',
  PROMO_CREDIT: 'Promo Credit',
  ADMIN_ADJUST: 'Admin Adjust',
  LOCK: 'Hold',
  UNLOCK: 'Hold Released',
  REVERSAL: 'Reversal',
};

export function getTransactionSourceLabel(source: WalletTransactionSource | string): string {
  return TRANSACTION_SOURCE_LABEL[source as WalletTransactionSource] ?? source;
}

export function formatLedgerDate(time: string): string {
  return new Date(time).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const WALLET_FILTER_OPTIONS: { value: 'ALL' | 'ACTIVE' | 'INACTIVE'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];
