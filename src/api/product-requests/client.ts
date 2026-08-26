import { authenticatedClient } from '@/api/common/client';
import type { ProductListItem } from '@/api/products';

import type { ProductRequestItem, UpdateProductRequestStatusPayload } from './types';

type VendorProductGroup = {
  tenant_id: number;
  tenant_name: string;
  products: (ProductListItem & { status: string })[];
};

export async function fetchProductRequests(): Promise<ProductRequestItem[]> {
  const { data } = await authenticatedClient.get<
    { data?: VendorProductGroup[]; results?: VendorProductGroup[] } | VendorProductGroup[]
  >('api/shop/marketplace/products/all/');
  const groups = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);

  const items: ProductRequestItem[] = [];
  for (const group of groups) {
    for (const product of group.products ?? []) {
      // Prefer `sold_by_name` (the actual seller) over the group's own
      // `tenant_name` — for marketplace-owned clones of approved vendor
      // products, the group is the marketplace itself, not the vendor
      // that's actually selling. Matches web's `ProductCard` precedence.
      items.push({ ...product, vendor_name: product.sold_by_name || group.tenant_name });
    }
  }
  return items;
}

export async function updateProductRequestStatus(payload: UpdateProductRequestStatusPayload): Promise<void> {
  await authenticatedClient.post('api/dashboard/products/approve-reject/', payload);
}
