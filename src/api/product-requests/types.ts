/**
 * Product Requests — ported from Vite's `Containers/Cms/ProductsRequest`
 * (marketplace-only, gated behind `tenantType === "marketplace"` in Vite's
 * `SideBar.jsx`, same as `Vendors` — see the implementation plan for why
 * this is built anyway) + `Api/cmsAPI.js`'s
 * `fetchMarketplaceProducts`/`updateVendorProductRequest`.
 */

export type ProductRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** `vendor_name` is stamped on client-side from the fetch response's group
 * (`tenant_name`) — see `client.ts`'s `fetchProductRequests` — not a raw
 * backend field on the product itself. */
export type ProductRequestItem = {
  id: number;
  product_name: string;
  description?: string;
  photo?: string;
  images?: string[];
  image?: string;
  market_price?: string | number;
  currency?: { symbol?: string };
  status: ProductRequestStatus | string;
  tenant_id: number;
  vendor_name?: string;
};

export type ProductRequestActionType = 'APPROVED' | 'REJECTED';

export type UpdateProductRequestStatusPayload = {
  product_ids: number[];
  action: ProductRequestActionType;
};
