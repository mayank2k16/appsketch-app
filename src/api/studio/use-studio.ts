import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { toast } from '@/lib/toast';

import { attachTenant, fetchAppGroups, fetchUserTenants } from './client';
import type { AppGroup, TenantSummary } from './types';

export const studioKeys = {
  all: ['studio'] as const,
  tenants: () => [...studioKeys.all, 'tenants'] as const,
  groups: () => [...studioKeys.all, 'groups'] as const,
};

export function useUserTenants() {
  return useQuery<TenantSummary[], AxiosError>({
    queryKey: studioKeys.tenants(),
    queryFn: fetchUserTenants,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useAttachTenant() {
  return useMutation({
    mutationFn: (tenantId: number | string) => attachTenant(tenantId),
    onError: () => toast.error('Unable to open this store'),
  });
}

export function useAppGroups() {
  return useQuery<AppGroup[], AxiosError>({
    queryKey: studioKeys.groups(),
    queryFn: fetchAppGroups,
    staleTime: 60 * 1000,
    retry: false,
  });
}
