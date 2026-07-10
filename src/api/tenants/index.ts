import { useQuery } from '@tanstack/react-query';

import type {
  TenantApiResponse,
  TenantConfig,
  TenantInfo,
} from '@/types/config';

import { client } from '../common/client';

export async function fetchTenantConfig(): Promise<TenantApiResponse> {
  const response = await client.get<TenantApiResponse>('api/account/tenant/');
  return response.data;
}

export function useTenantConfig(tenantId: string, configUrl?: string) {
  return useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      if (configUrl) {
        const response = await fetch(configUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        return (await response.json()) as TenantConfig;
      }
      const response = await client.get<TenantConfig>(
        `/tenants/${tenantId}/config`
      );
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await client.get<TenantInfo[]>('/tenants');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTenantById(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await client.get<TenantInfo>(`/tenants/${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
  });
}
