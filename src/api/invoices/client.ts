import { authenticatedClient } from '@/api/common/client';
import type { EntityOption } from '@/api/payments';

import type {
  ChallanOption,
  CompanyDetails,
  CreateInvoicePayload,
  InvoiceDetailResponse,
  InvoiceInventoryOption,
  InvoiceListItem,
  InvoiceProductOption,
  UpdateInvoiceDateAndNoPayload,
} from './types';

export async function fetchInvoices(offset = 0, limit = 10): Promise<InvoiceListItem[]> {
  const { data } = await authenticatedClient.get<{ results: InvoiceListItem[] }>('api/shop/invoices', {
    params: { limit, offset },
  });
  return data.results ?? [];
}

// Same endpoint as `fetchInvoices`, but the `searchKey` mode returns a bare
// array instead of `{results: [...]}` — confirmed against Vite's `Invoice.jsx`
// (`const {data} = await searchInvoices(query); ...list: data`). Named
// `searchInvoiceRecords` (not `searchInvoices`) to avoid colliding with
// `@/api/payments`' narrower invoice-picker function of that name — both are
// flat-barrel-exported from `src/api/index.tsx`.
export async function searchInvoiceRecords(query: string): Promise<InvoiceListItem[]> {
  const { data } = await authenticatedClient.get<InvoiceListItem[]>('api/shop/invoices', {
    params: { searchKey: query },
  });
  return data ?? [];
}

export async function deleteInvoice(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/invoices/${id}/`);
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<{ msg?: string }> {
  const { data } = await authenticatedClient.post('api/shop/invoices/', payload);
  return data;
}

export async function updateInvoice(id: number, payload: CreateInvoicePayload): Promise<{ msg?: string }> {
  const { data } = await authenticatedClient.patch(`api/shop/invoices/${id}/`, payload);
  return data;
}

export async function updateInvoiceDateAndNo(id: number, payload: UpdateInvoiceDateAndNoPayload): Promise<unknown> {
  const { data } = await authenticatedClient.patch(`api/shop/invoices/${id}/modify-fields/`, payload);
  return data;
}

export async function fetchInvoiceDetailsById(id: number): Promise<InvoiceDetailResponse> {
  const { data } = await authenticatedClient.get<InvoiceDetailResponse>(`api/shop/get_invoice/${id}`);
  return data;
}

export async function fetchAllEntities(): Promise<EntityOption[]> {
  const { data } = await authenticatedClient.get<EntityOption[]>('api/shop/entities/');
  return data ?? [];
}

export async function searchChallans(query: string): Promise<ChallanOption[]> {
  const { data } = await authenticatedClient.get<ChallanOption[]>('api/shop/challan/searchitem/', {
    params: { searchKey: query },
  });
  return data ?? [];
}

export async function fetchInvoiceInventories(): Promise<InvoiceInventoryOption[]> {
  const { data } = await authenticatedClient.get<{ message: InvoiceInventoryOption[] }>('api/shop/inventories/');
  return data.message ?? [];
}

export async function fetchProductsByInventory(inventoryId: string | number): Promise<InvoiceProductOption[]> {
  const { data } = await authenticatedClient.get<{ data: InvoiceProductOption[] }>('api/shop/products/data/', {
    params: { inv: inventoryId },
  });
  return data.data ?? [];
}

export async function fetchCompanyDetails(): Promise<CompanyDetails> {
  const { data } = await authenticatedClient.post<CompanyDetails>('api/account/company/details');
  return data;
}
