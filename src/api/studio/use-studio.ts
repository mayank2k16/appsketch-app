import type { AxiosError } from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { attachTenant, fetchUserTenants } from './client';
import type { TenantSummary } from './types';

export const studioKeys = {
  all: ['studio'] as const,
  tenants: () => [...studioKeys.all, 'tenants'] as const,
};

export function useUserTenants() {
  return useQuery<TenantSummary[], AxiosError>({
    queryKey: studioKeys.tenants(),
    queryFn: fetchUserTenants,
    staleTime: 60 * 1000,
  });
}

export function useAttachTenant() {
  return useMutation({
    mutationFn: (tenantId: number | string) => attachTenant(tenantId),
    onError: () => toast.error('Unable to open this store'),
  });
}
