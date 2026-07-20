import { authenticatedClient } from '@/api/common/client';
import { useAuth } from '@/hooks/useAuth';

import type { Commission, CommissionPayload, VendorActionType, VendorListItem } from './types';

/**
 * Best-effort tenant ID for the two endpoints below that need one as a URL
 * path segment (`/dashboard/{tenantId}/vendors/`) — Vite sources this from a
 * `?tenant=` query param on the CMS URL, which has no equivalent in
 * appsketch-app (every other endpoint in this port relies on the auth token
 * alone for tenant scoping). `AuthUser` is an opaque `Record<string,
 * unknown>` (`src/api/auth/types.ts`), so `tenant_id` here is an unverified
 * guess at the field name — confirm/fix once there's a real marketplace
 * tenant session to test against.
 */
function getTenantId(): string {
  const user = useAuth.getState().user as Record<string, unknown> | null;
  const tenantId = user?.tenant_id ?? user?.tenant_uuid ?? user?.tenant;
  return tenantId ? String(tenantId) : '';
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
