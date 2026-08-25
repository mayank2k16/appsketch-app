import { authenticatedClient } from '@/api/common/client';
import { useStudio } from '@/lib/store/studio-store';

import type { Commission, CommissionPayload, VendorActionType, VendorListItem } from './types';

/**
 * Tenant ID for the two endpoints below that need one as a URL path segment
 * (`/dashboard/{tenantId}/vendors/`) — Vite sources this from a `?tenant=`
 * query param on the CMS URL; here it comes from the attached-tenant store
 * (`uuid` preferred, `id` as fallback), the same tenant the CMS shell itself
 * is scoped to.
 */
function getTenantId(): string {
  const tenant = useStudio.getState().attachedTenant;
  return String(tenant?.uuid || tenant?.id || '');
}

export async function fetchVendorsList(): Promise<VendorListItem[]> {
  const { data } = await authenticatedClient.get<VendorListItem[]>(`api/dashboard/${getTenantId()}/vendors/`);
  return data ?? [];
}

export async function vendorRequestAction(vendorId: number, action: VendorActionType): Promise<void> {
  await authenticatedClient.post(`api/dashboard/${getTenantId()}/vendors/`, { vendor_id: vendorId, action });
}

export async function fetchCommissions(): Promise<Commission[]> {
  const { data } = await authenticatedClient.get<Commission[]>('api/account/commissions/');
  return data ?? [];
}

export async function createCommission(payload: CommissionPayload): Promise<Commission> {
  const { data } = await authenticatedClient.post<Commission>('api/account/commissions/', {
    ...payload,
    tenant_uuid: getTenantId(),
  });
  return data;
}

export async function updateCommission(id: number, payload: Partial<CommissionPayload>): Promise<Commission> {
  const { data } = await authenticatedClient.patch<Commission>(`api/account/commissions/${id}/`, {
    ...payload,
    tenant_uuid: getTenantId(),
  });
  return data;
}

export async function deleteCommission(id: number): Promise<void> {
  await authenticatedClient.delete(`api/account/commissions/${id}/`);
}
