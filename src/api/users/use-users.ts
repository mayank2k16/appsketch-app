import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createProfile,
  createStaff,
  deleteProfile,
  deleteStaff,
  fetchProfiles,
  fetchStaff,
  fetchUserInventories,
  fetchUsersMeta,
  updateProfile,
  updateStaff,
} from './client';
import type { AppUserPayload, AppUserProfile, StaffPayload, UsersListParams } from './types';

export const USERS_PAGE_SIZE = 10;

export const userKeys = {
  all: ['users'] as const,
  meta: () => [...userKeys.all, 'meta'] as const,
  inventories: () => [...userKeys.all, 'inventories'] as const,
  appUsers: (params: UsersListParams) => [...userKeys.all, 'app', params] as const,
  staff: (params: UsersListParams) => [...userKeys.all, 'staff', params] as const,
};

export function useUsersMeta() {
  return useQuery<Awaited<ReturnType<typeof fetchUsersMeta>>, AxiosError>({
    queryKey: userKeys.meta(),
    queryFn: fetchUsersMeta,
  });
}

export function useUserInventories() {
  return useQuery<Awaited<ReturnType<typeof fetchUserInventories>>, AxiosError>({
    queryKey: userKeys.inventories(),
    queryFn: fetchUserInventories,
  });
}

/** App Users' list endpoint genuinely paginates (`{results, count}` +
 * `limit`/`offset`, confirmed by the pager this replaced) — real
 * infinite-scroll, one network page per `fetchNextPage()` call. */
export function useAppUsers(params: Omit<UsersListParams, 'limit' | 'offset'>, enabled = true) {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchProfiles>>, AxiosError>({
    queryKey: userKeys.appUsers(params),
    queryFn: ({ pageParam }) =>
      fetchProfiles({ ...params, limit: USERS_PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const pageResults = Array.isArray(lastPage) ? lastPage : lastPage.results;
      const loaded = allPages.reduce(
        (sum, p) => sum + (Array.isArray(p) ? p.length : p.results.length),
        0
      );
      const count = Array.isArray(lastPage) ? undefined : lastPage.count;
      if (count != null) return loaded < count ? loaded : undefined;
      return pageResults.length < USERS_PAGE_SIZE ? undefined : loaded;
    },
    enabled,
  });
}

export function flattenAppUsersPages(
  pages: Awaited<ReturnType<typeof fetchProfiles>>[] | undefined
): AppUserProfile[] {
  return (pages ?? []).flatMap((p) => (Array.isArray(p) ? p : p.results));
}

export function useStaffUsers(params: UsersListParams, enabled = true) {
  return useQuery<Awaited<ReturnType<typeof fetchStaff>>, AxiosError>({
    queryKey: userKeys.staff(params),
    queryFn: () => fetchStaff(params),
    enabled,
  });
}

export function useCreateAppUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, AppUserPayload>({
    mutationFn: (payload) => createProfile(payload),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Save failed'),
  });
}

export function useUpdateAppUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: Partial<AppUserPayload> }>({
    mutationFn: ({ id, payload }) => updateProfile(id, payload),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Save failed'),
  });
}

export function useDeleteAppUser() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteProfile(id),
    onSuccess: () => {
      toast.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Failed to deactivate user'),
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, StaffPayload>({
    mutationFn: (payload) => createStaff(payload),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Save failed'),
  });
}

export function useUpdateStaffUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: Partial<StaffPayload> }>({
    mutationFn: ({ id, payload }) => updateStaff(id, payload),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Save failed'),
  });
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteStaff(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Failed to delete user'),
  });
}
