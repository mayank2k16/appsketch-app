/**
 * CMS Users domain types — ported from Vite's `Containers/Cms/AddUser`
 * (`AddUser.jsx` — the only live file; `AddModal/`, `DeleteModal/`,
 * `Tables/` are all orphaned, see the implementation plan) + `Api/cmsAPI.js`.
 */

export type UserRole = 'C' | 'DP' | 'SK' | 'ADMIN' | 'DOCTOR' | 'SURGERY_BOY';

export type UserRoleOption = { value: string; label: string };
export type UserGroupOption = { id: number; name: string };
export type UserPermissionOption = { id: number; codename: string };
export type UserInventoryOption = { id: number; name: string; code?: string };

export type UsersMeta = {
  roles: UserRoleOption[];
  groups: UserGroupOption[];
  permissions: UserPermissionOption[];
  inventories: UserInventoryOption[];
};

export type AppUserProfile = {
  id: number;
  name?: string;
  phone_number?: string;
  email?: string;
  username?: string;
  role?: string;
  inventory?: string | number | null;
  is_active?: boolean;
  is_verified?: boolean;
};

export type StaffUser = {
  id: number;
  name?: string;
  phone_number?: string;
  email?: string;
  username?: string;
  role?: string;
  groups?: number[];
  user_permissions?: number[];
  is_active?: boolean;
  is_verified?: boolean;
};

export type AppUserPayload = {
  name: string;
  phone_number: string;
  email: string | null;
  username?: string;
  role: string | null;
  inventory: string | number | null;
  is_active: boolean;
  is_verified: boolean;
};

export type StaffPayload = {
  name: string;
  phone_number: string;
  email: string | null;
  username?: string;
  role: string | null;
  groups: number[];
  user_permissions: number[];
  is_active: boolean;
  is_verified: boolean;
  password?: string;
};

export type UsersStatusFilter = 'active' | 'inactive' | 'all';

export type UsersListParams = {
  role?: string;
  search?: string;
  is_active?: 'true' | 'false';
  include_inactive?: number;
  limit?: number;
  offset?: number;
};

// Both endpoints are inconsistently shaped in Vite's own backend contract —
// DRF-paginated (`{results, count}`) or a bare array, depending on whether
// the view applies pagination. Porting both shapes through untouched and
// letting the screen branch on `Array.isArray`, same as Vite's own `load()`.
export type FetchProfilesResponse = { results: AppUserProfile[]; count: number } | AppUserProfile[];
export type FetchStaffResponse = { results: StaffUser[] } | StaffUser[];
