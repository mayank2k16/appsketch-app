import type { OrderStatus, PaymentStatus } from '@/api/orders';

import type { CmsStatusMeta } from '../components';

export function formatOrderDate(time: string): string {
  const timestamp = new Date(time);
  const day = timestamp.getDate();
  const month = timestamp.toLocaleString('default', { month: 'short' });
  const year = timestamp.getFullYear();
  return `${day} ${month}, ${year}`;
}

export type StatusMeta = CmsStatusMeta;

const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: 'Pending', color: '#FF9800', kind: 'warning' },
  SUCCESS: { label: 'Success', color: '#4CAF50', kind: 'success' },
  CHECKOUT: { label: 'Checkout', color: '#2563EB', kind: 'info' },
  FAILED: { label: 'Failed', color: '#F44336', kind: 'danger' },
};

export function getPaymentStatusMeta(status: PaymentStatus | string): StatusMeta {
  return PAYMENT_STATUS_META[status as PaymentStatus] ?? { label: status, color: '#94A3B8', kind: 'info' };
}

const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  INITIALISED: { label: 'Initialised', color: '#64748B', kind: 'info' },
  ORDER_PLACED: { label: 'Order Placed', color: '#2563EB', kind: 'info' },
  IN_TRANSIT: { label: 'In Transit', color: '#0891B2', kind: 'info' },
  DELIVERED: { label: 'Delivered', color: '#4CAF50', kind: 'success' },
  INVOICE_GENERATED: { label: 'Invoice Generated', color: '#7C3AED', kind: 'info' },
  REFUND_INITIATED: { label: 'Refund Initiated', color: '#FF9800', kind: 'warning' },
  REFUNDED_AND_CLOSED: { label: 'Refunded & Closed', color: '#6B7280', kind: 'info' },
  CANCELLED: { label: 'Cancelled', color: '#F44336', kind: 'danger' },
  DISCARDED: { label: 'Discarded', color: '#F44336', kind: 'danger' },
};

export function getOrderStatusMeta(status: OrderStatus | string): StatusMeta {
  // Vite's backend also emits a misspelled "INTIALISED" variant for the same state.
  const normalized = status === 'INTIALISED' ? 'INITIALISED' : status;
  return ORDER_STATUS_META[normalized as OrderStatus] ?? { label: status, color: '#94A3B8', kind: 'info' };
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = (
  Object.keys(ORDER_STATUS_META) as OrderStatus[]
).map((value) => ({ value, label: ORDER_STATUS_META[value].label }));

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = (
  Object.keys(PAYMENT_STATUS_META) as PaymentStatus[]
).map((value) => ({ value, label: PAYMENT_STATUS_META[value].label }));

export const FULFILMENT_TYPE_OPTIONS = [
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'TAKE_AWAY', label: 'Take Away' },
  { value: 'SURGERY', label: 'Surgery' },
] as const;

export const DELIVERY_TYPE_OPTIONS = [
  { value: 'EXPRESS', label: 'Express' },
  { value: 'EXPRESS_DELIVERY', label: 'Express Delivery' },
  { value: 'EVERYTHING', label: 'Everything' },
  { value: 'TAKE_AWAY', label: 'Take Away' },
] as const;
