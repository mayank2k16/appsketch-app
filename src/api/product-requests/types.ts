/**
 * Product Requests — ported from Vite's `Containers/Cms/ProductsRequest`
 * (marketplace-only, gated behind `tenantType === "marketplace"` in Vite's
 * `SideBar.jsx`, same as `Vendors` — see the implementation plan for why
 * this is built anyway) + `Api/cmsAPI.js`'s
 * `fetchMarketplaceProducts`/`updateVendorProductRequest`.
 */

import type { ProductListItem } from '@/api/products';

export type ProductRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** The marketplace products endpoint returns full `ProductListItem` rows
 * (media, categories, variants, `sellable_inventory`, `review_notes`, …) —
 * this just adds the review-queue-only fields on top. `vendor_name` is
 * stamped on client-side (preferring `sold_by_name`, falling back to the
 * owning group's `tenant_name`) — see `client.ts`'s `fetchProductRequests` —
 * not a raw backend field on the product itself. */
export type ProductRequestItem = ProductListItem & {
  status: ProductRequestStatus | string;
  vendor_name?: string;
};

export type ProductRequestActionType = 'APPROVED' | 'REJECTED';

export type UpdateProductRequestStatusPayload = {
  product_ids: number[];
  action: ProductRequestActionType;
  /** Which of the marketplace's own inventories approved stock should be
   * added to — required by the backend when `action === 'APPROVED'`. */
  inventory_id?: number;
  /** Rejection reason sent back to the vendor — required by the backend
   * when `action === 'REJECTED'`. */
  notes?: string;
};
