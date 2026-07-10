/**
 * Studio API client — account-level endpoints, mirrors the Vite reference's
 * `Api/tenantAPI.js` (`fetchAllTenantsByUser`, `updateTenant`). Uses
 * `accountClient` (bearer-authed, no tenant path segment).
 */
import { accountClient } from '@/api/common/client';

import type { TenantSummary } from './types';

export async function fetchUserTenants(): Promise<TenantSummary[]> {
  const { data } = await accountClient.get<TenantSummary[]>('account/tenants/');
  return data ?? [];
}

/**
 * Tells the backend to switch the logged-in account's active tenant context.
 * The response body isn't meaningful (matches the Vite reference) — only a
 * 2xx status confirms the switch succeeded.
 */
export async function attachTenant(tenantId: number | string): Promise<void> {
  await accountClient.post('account/update-tenant/', { tenant_id: tenantId });
}
