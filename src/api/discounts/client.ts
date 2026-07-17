import { authenticatedClient } from '@/api/common/client';
import type { InvoiceListItem } from '@/api/invoices';

import type { DiscountCodeItem, DiscountPayload } from './types';

export async function fetchDiscountCodes(): Promise<DiscountCodeItem[]> {
  const { data } = await authenticatedClient.get<DiscountCodeItem[]>('api/shop/discounts/');
  return data ?? [];
}

export async function createDiscount(payload: DiscountPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/shop/discounts/', payload);
  return data;
}

export async function updateDiscount(id: number, payload: DiscountPayload): Promise<unknown> {
  const { data } = await authenticatedClient.patch(`api/shop/discounts/${id}/`, payload);
  return data;
}

export async function deleteDiscount(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/discounts/${id}/`);
}

// Bare full-fetch variant of the invoices list, used only by the discount
// scope picker (Vite's `fetchAllInvoicesAtOnce`, `/shop/get_invoices/`) —
// distinct from `@/api/invoices`' paginated `fetchInvoices`/searched
// `searchInvoiceRecords`, but reuses that domain's `InvoiceListItem` type
// since it's the same entity.
export async function fetchAllInvoices(): Promise<InvoiceListItem[]> {
  const { data } = await authenticatedClient.get<{ data: InvoiceListItem[] }>('api/shop/get_invoices/');
  return data.data ?? [];
}
