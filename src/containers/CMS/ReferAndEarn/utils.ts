import type { ReferralRule, ReferralStatus, ReferralTrigger } from '@/api/referrals';

import type { CmsStatusMeta } from '../components';

export function inr(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export const TRIGGER_LABEL: Record<ReferralTrigger, string> = {
  SIGNUP_VERIFIED: 'Signup Verified',
  FIRST_ORDER_PAID: 'First Order Paid',
  FIRST_ORDER_DELIVERED: 'First Order Delivered',
  NTH_ORDER_PAID: 'Nth Order Paid',
  NTH_ORDER_DELIVERED: 'Nth Order Delivered',
  CUMULATIVE_SPEND_REACHED: 'Cumulative Spend Reached',
  REFERRER_SIGNUPS_MILESTONE: 'Referrer · N Signups',
  REFERRER_PAID_MILESTONE: 'Referrer · N Paid First-Orders',
  REFERRER_DELIVERED_MILESTONE: 'Referrer · N Delivered First-Orders',
  REFERRER_SPEND_MILESTONE: 'Referrer · Cumulative Referee Spend',
};

export const MILESTONE_TRIGGERS = new Set<string>([
  'REFERRER_SIGNUPS_MILESTONE',
  'REFERRER_PAID_MILESTONE',
  'REFERRER_DELIVERED_MILESTONE',
  'REFERRER_SPEND_MILESTONE',
]);

export const USES_ORDER_COUNT_THRESHOLD = new Set<string>(['NTH_ORDER_PAID', 'NTH_ORDER_DELIVERED']);
export const USES_SPEND_THRESHOLD = new Set<string>(['CUMULATIVE_SPEND_REACHED']);
export const USES_REFERRER_COUNT_THRESHOLD = new Set<string>([
  'REFERRER_SIGNUPS_MILESTONE',
  'REFERRER_PAID_MILESTONE',
  'REFERRER_DELIVERED_MILESTONE',
]);
export const USES_REFERRER_SPEND_THRESHOLD = new Set<string>(['REFERRER_SPEND_MILESTONE']);

export function formatReward(type: string | undefined, value: string | number | undefined): string {
  if (!type) return '—';
  const n = Number(value || 0);
  if (type === 'FLAT') return inr(n);
  if (type === 'PERCENT') return `${n}%`;
  if (type === 'TIERED') return 'Tiered';
  return String(n);
}

export function isRuleWithinWindow(rule: ReferralRule): boolean {
  const now = Date.now();
  if (rule.valid_from && new Date(rule.valid_from).getTime() > now) return false;
  if (rule.valid_to && new Date(rule.valid_to).getTime() < now) return false;
  return true;
}

const STATUS_META: Record<ReferralStatus, CmsStatusMeta> = {
  PENDING: { label: 'Pending', color: '#D97706', kind: 'warning' },
  QUALIFIED: { label: 'Qualified', color: '#16A34A', kind: 'success' },
  EXPIRED: { label: 'Expired', color: '#64748B', kind: 'info' },
  REJECTED: { label: 'Rejected', color: '#DC2626', kind: 'danger' },
};

export function getReferralStatusMeta(status: ReferralStatus | string): CmsStatusMeta {
  return STATUS_META[status as ReferralStatus] ?? { label: status, color: '#94A3B8', kind: 'info' };
}
