import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
import type { AppUserPayload, StaffPayload, UsersListParams } from './types';

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

export function useAppUsers(params: UsersListParams, enabled = true) {
  return useQuery<Awaited<ReturnType<typeof fetchProfiles>>, AxiosError>({
    queryKey: userKeys.appUsers(params),
    queryFn: () => fetchProfiles(params),
    enabled,
  });
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
