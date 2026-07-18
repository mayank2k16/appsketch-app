import { authenticatedClient } from '@/api/common/client';

import type { ProductRequestItem, UpdateProductRequestStatusPayload } from './types';

type VendorProductGroup = { tenant_id: number; tenant_name: string; products: ProductRequestItem[] };

export async function fetchProductRequests(): Promise<ProductRequestItem[]> {
  const { data } = await authenticatedClient.get<
    { data?: VendorProductGroup[]; results?: VendorProductGroup[] } | VendorProductGroup[]
  >('api/shop/marketplace/products/all/');
  const groups = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);

  const items: ProductRequestItem[] = [];
  for (const group of groups) {
    for (const product of group.products ?? []) {
      items.push({ ...product, vendor_name: group.tenant_name });
    }
  }
  return items;
}

export async function updateProductRequestStatus(payload: UpdateProductRequestStatusPayload): Promise<void> {
  await authenticatedClient.post('api/dashboard/products/approve-reject/', payload);
}
