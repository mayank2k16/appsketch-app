import { authenticatedClient } from '@/api/common/client';

import type {
  AppUserPayload,
  FetchProfilesResponse,
  FetchStaffResponse,
  StaffPayload,
  UserInventoryOption,
  UsersListParams,
  UsersMeta,
} from './types';

const DEFAULT_ROLES = [
  { value: 'C', label: 'CUSTOMER' },
  { value: 'DP', label: 'DELIVERYPARTNER' },
  { value: 'SK', label: 'STOREMANAGER' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'DOCTOR', label: 'DOCTOR' },
  { value: 'SURGERY_BOY', label: 'SURGERY_BOY' },
];

/** Roles/groups/permissions from the meta endpoint — keeps `DEFAULT_ROLES`
 * (mirrors `account/constants.py` ROLE) if it returns nothing or errors, so
 * the role dropdown always works, same resilience measure as Vite's own
 * `AddUser.jsx` comment describes. */
export async function fetchUsersMeta(): Promise<Omit<UsersMeta, 'inventories'>> {
  try {
    const { data } = await authenticatedClient.get<{
      roles?: UsersMeta['roles'];
      groups?: UsersMeta['groups'];
      permissions?: UsersMeta['permissions'];
    }>('api/account/cms/users/meta/');
    return {
      roles: data.roles && data.roles.length ? data.roles : DEFAULT_ROLES,
      groups: data.groups || [],
      permissions: data.permissions || [],
    };
  } catch {
    return { roles: DEFAULT_ROLES, groups: [], permissions: [] };
  }
}

/** Vite's `fetchInventorysCms` — a third distinct inventory-list
 * endpoint/shape beyond the two already in this app (see the
 * implementation plan for the precedent). */
export async function fetchUserInventories(): Promise<UserInventoryOption[]> {
  try {
    const { data } = await authenticatedClient.get<
      { results?: unknown[]; message?: unknown[] } | unknown[]
    >('api/dashboard/inventory/');
    const list = Array.isArray(data) ? data : (data.results ?? data.message ?? []);
    return (list as Record<string, unknown>[])
      .map((i) => ({
        id: i.id as number,
        name: (i.name ?? i.title ?? i.code) as string,
        code: i.code as string | undefined,
      }))
      .filter((i) => i.id != null);
  } catch {
    return [];
  }
}

export async function fetchProfiles(params: UsersListParams): Promise<FetchProfilesResponse> {
  const { data } = await authenticatedClient.get<FetchProfilesResponse>('api/account/profile/', { params });
  return data;
}

export async function createProfile(payload: AppUserPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/account/profile/', payload);
  return data;
}

export async function updateProfile(id: number, payload: Partial<AppUserPayload>): Promise<unknown> {
  const { data } = await authenticatedClient.patch(`api/account/profile/${id}/`, payload);
  return data;
}

/** Soft delete (deactivate) — the backend default for this endpoint. */
export async function deleteProfile(id: number): Promise<void> {
  await authenticatedClient.delete(`api/account/profile/${id}/`);
}

export async function fetchStaff(params: UsersListParams): Promise<FetchStaffResponse> {
  const { data } = await authenticatedClient.get<FetchStaffResponse>('api/account/tenant-users/', { params });
  return data;
}

export async function createStaff(payload: StaffPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/account/tenant-users/', payload);
  return data;
}

export async function updateStaff(id: number, payload: Partial<StaffPayload>): Promise<unknown> {
  const { data } = await authenticatedClient.patch(`api/account/tenant-users/${id}/`, payload);
  return data;
}

/** Hard delete — distinct from `deleteProfile`'s soft-deactivate default. */
export async function deleteStaff(id: number): Promise<void> {
  await authenticatedClient.delete(`api/account/tenant-users/${id}/`);
}
