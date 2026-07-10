import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createCustomVariable,
  deleteCustomVariable,
  fetchCustomVariables,
  fetchNotificationConfig,
  fetchNotificationCustomers,
  fetchNotificationLogs,
  fetchSystemVariables,
  updateCustomVariable,
  updateNotificationConfig,
} from './client';
import type {
  CustomVariablePayload,
  NotificationConfigPayload,
  NotificationCustomerFilters,
  NotificationLogFilters,
} from './types';

export const notificationKeys = {
  all: ['notifications'] as const,
  logs: (filters: NotificationLogFilters) => [...notificationKeys.all, 'logs', filters] as const,
  customers: (filters: NotificationCustomerFilters) =>
    [...notificationKeys.all, 'customers', filters] as const,
  config: () => [...notificationKeys.all, 'config'] as const,
  systemVariables: () => [...notificationKeys.all, 'system-variables'] as const,
  customVariables: () => [...notificationKeys.all, 'custom-variables'] as const,
};

export function useNotificationLogs(filters: NotificationLogFilters = {}) {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationLogs>>, AxiosError>({
    queryKey: notificationKeys.logs(filters),
    queryFn: () => fetchNotificationLogs(filters),
  });
}

export function useNotificationCustomers(filters: NotificationCustomerFilters = {}) {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationCustomers>>, AxiosError>({
    queryKey: notificationKeys.customers(filters),
    queryFn: () => fetchNotificationCustomers(filters),
  });
}

export function useNotificationConfig() {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationConfig>>, AxiosError>({
    queryKey: notificationKeys.config(),
    queryFn: fetchNotificationConfig,
  });
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationConfigPayload) => updateNotificationConfig(payload),
    onSuccess: () => {
      toast.success('Channel settings saved');
      queryClient.invalidateQueries({ queryKey: notificationKeys.config() });
    },
    onError: () => toast.error('Failed to save channel settings'),
  });
}

export function useSystemVariables() {
  return useQuery<Awaited<ReturnType<typeof fetchSystemVariables>>, AxiosError>({
    queryKey: notificationKeys.systemVariables(),
    queryFn: fetchSystemVariables,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomVariables() {
  return useQuery<Awaited<ReturnType<typeof fetchCustomVariables>>, AxiosError>({
    queryKey: notificationKeys.customVariables(),
    queryFn: fetchCustomVariables,
  });
}

export function useCreateCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomVariablePayload) => createCustomVariable(payload),
    onSuccess: () => {
      toast.success('Variable added');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to add variable'),
  });
}

export function useUpdateCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomVariablePayload }) =>
      updateCustomVariable(id, payload),
    onSuccess: () => {
      toast.success('Variable updated');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to update variable'),
  });
}

export function useDeleteCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomVariable(id),
    onSuccess: () => {
      toast.success('Variable deleted');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to delete variable'),
  });
}
