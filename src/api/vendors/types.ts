/**
 * Vendors domain types — ported from Vite's `Containers/Cms/Vendors`
 * (marketplace-only, gated behind `tenantType === "marketplace"` in Vite's
 * `SideBar.jsx` — see the implementation plan for why this is built anyway)
 * + `Api/cmsAPI.js`.
 */

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export type VendorListItem = {
  id: number;
  title: string;
  status: VendorStatus | string;
  tenant_type?: string;
  documents?: Record<string, string>;
};

export type VendorActionType = 'approve' | 'reject';

export type CommissionType = 'percentage' | 'fixed';

export type Commission = {
  id: number;
  vendor: number;
  commission_type: CommissionType | string;
  value: string | number;
  min_order_value?: string | number;
  max_commission?: string | number;
  is_active: boolean;
  priority: number;
  valid_from?: string | null;
  valid_to?: string | null;
};

// `tenant_uuid` is deliberately not part of the caller-supplied shape —
// `createCommission`/`updateCommission` inject it internally via the same
// best-effort tenant-ID lookup `fetchVendorsList` uses, so that unverified
// guess stays in one place (`client.ts`) instead of leaking into the UI.
export type CommissionPayload = {
  commission_type: CommissionType;
  value: string;
  min_order_value?: string;
  max_commission?: string;
  is_active: boolean;
  priority: number;
  valid_from?: string;
  valid_to?: string;
  apply_on: 'vendor';
  vendor: number;
};
