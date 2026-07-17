import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type {
  BulkPaymentDetail,
  CreateBulkPaymentPayload,
  CreatePaymentPayload,
  EntityOption,
  InvoiceOption,
  PaymentAttachment,
  PaymentComment,
  PaymentListItem,
  PendingPaymentForEntity,
  UpdatePaymentPayload,
  VendorSettlementListItem,
} from './types';

// ── Regular payments ─────────────────────────────────────────────────────

export async function fetchPayments(): Promise<PaymentListItem[]> {
  const { data } = await authenticatedClient.get<{ data: PaymentListItem[] }>('api/shop/payments/');
  return data.data ?? [];
}

export async function createPayment(payload: CreatePaymentPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/shop/payments/', payload);
  return data;
}

export async function updatePayment(payload: UpdatePaymentPayload): Promise<unknown> {
  const { payment_id, ...rest } = payload;
  const { data } = await authenticatedClient.patch(`api/shop/payments/${payment_id}/`, rest);
  return data;
}

export async function searchInvoices(query: string): Promise<InvoiceOption[]> {
  if (!query.trim()) return [];
  const { data } = await authenticatedClient.get<InvoiceOption[]>('api/shop/invoices', {
    params: { searchKey: query },
  });
  return data ?? [];
}

export async function fetchPaymentAttachments(paymentId: number): Promise<PaymentAttachment[]> {
  const { data } = await authenticatedClient.get<PaymentAttachment[]>('api/shop/payment/attachments/', {
    params: { payment_id: paymentId },
  });
  return data ?? [];
}

export async function uploadPaymentAttachment(
  paymentId: number,
  asset: { uri: string; name: string; type: string }
): Promise<void> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // RN Web's FormData needs a real Blob/File, not the {uri,name,type} triple
    // the native bridge understands — same pattern as `uploadProductMedia`.
    const blob = await (await fetch(asset.uri)).blob();
    formData.append('attachment_file', blob, asset.name);
  } else {
    // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
    formData.append('attachment_file', asset);
  }
  formData.append('payment_id', String(paymentId));
  await authenticatedClient.post('api/shop/payment/attachments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deletePaymentAttachment(attachmentId: number, paymentId: number): Promise<void> {
  await authenticatedClient.delete('api/shop/payment/attachments/', {
    data: { attachment_id: attachmentId, payment_id: paymentId },
  });
}

export async function fetchPaymentComments(paymentId: number): Promise<PaymentComment[]> {
  const { data } = await authenticatedClient.get<PaymentComment[]>('api/shop/payment/comments/', {
    params: { payment_id: paymentId },
  });
  return data ?? [];
}

export async function createPaymentComment(paymentId: number, comment: string): Promise<void> {
  await authenticatedClient.post('api/shop/payment/comments/', { comment, payment_id: paymentId });
}

// ── Bulk payments ────────────────────────────────────────────────────────

// The list response embeds each row's `corresponding_payments` (confirmed
// against Vite's `BulkPayment.jsx`, which reads that field straight off the
// clicked list row for its detail view — no separate detail endpoint).
export async function fetchBulkPayments(offset = 0): Promise<BulkPaymentDetail[]> {
  const { data } = await authenticatedClient.get<{ results: BulkPaymentDetail[] }>(
    'api/shop/bulk-payments/',
    { params: { limit: 10, offset } }
  );
  return data.results ?? [];
}

export async function createBulkPayment(payload: CreateBulkPaymentPayload): Promise<unknown> {
  const formData = new FormData();
  formData.append('entity', String(payload.entity));
  formData.append('amount', String(payload.amount));
  formData.append('payment_date', payload.payment_date);
  formData.append('type', payload.type);
  formData.append('ref_no', payload.ref_no);
  formData.append('comment', payload.comment);
  formData.append('payments_to_mark', payload.payments_to_mark.join(','));
  formData.append('automated_marking', String(payload.automated_marking));
  for (const asset of payload.attachments) {
    if (Platform.OS === 'web') {
      const blob = await (await fetch(asset.uri)).blob();
      formData.append('attachments', blob, asset.name);
    } else {
      // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
      formData.append('attachments', asset);
    }
  }
  const { data } = await authenticatedClient.post('api/shop/bulk-payments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchPendingPaymentsForEntity(entityId: string | number): Promise<PendingPaymentForEntity[]> {
  const { data } = await authenticatedClient.get<{ data: PendingPaymentForEntity[] }>('api/shop/payments/', {
    params: { entity_id: entityId, status: 'PENDING' },
  });
  return data.data ?? [];
}

export async function searchEntities(query: string): Promise<EntityOption[]> {
  const { data } = await authenticatedClient.get<EntityOption[]>('api/shop/entities/', {
    params: { searchKey: query },
  });
  return data ?? [];
}

// ── Vendor settlements ───────────────────────────────────────────────────

export async function fetchVendorSettlements(): Promise<VendorSettlementListItem[]> {
  const { data } = await authenticatedClient.get<VendorSettlementListItem[]>('api/shop/vendor-settlements/');
  return data ?? [];
}

export async function deleteVendorSettlement(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/vendor-settlements/${id}/`);
}
