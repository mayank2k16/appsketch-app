import React, { createContext, useContext, useEffect, useState } from 'react';

import { fetchTenantConfig } from '@/api/tenants';
import { getItem, setItem } from '@/lib/storage';
import type {
  TenantApiResponse,
  TenantConfig,
  TenantInfo,
} from '@/types/config';

type TenantContextType = {
  currentTenant: TenantInfo | null;
  tenantConfig: TenantConfig | null;
  tenantData: TenantApiResponse | null;
  isLoading: boolean;
  error: Error | null;
  setTenant: (tenant: TenantInfo) => Promise<void>;
  setTenantData: (data: TenantApiResponse) => Promise<void>;
  fetchAndSetTenant: () => Promise<TenantApiResponse>;
  loadTenantConfig: (tenantId: string) => Promise<void>;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_STORAGE_KEY = 'current_tenant';
const TENANT_CONFIG_STORAGE_KEY = 'tenant_config';
const TENANT_DATA_STORAGE_KEY = 'tenant_data';

type TenantProviderProps = {
  children: React.ReactNode;
};

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [tenantData, setTenantDataState] = useState<TenantApiResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializeTenant() {
      try {
        const storedData = getItem<TenantApiResponse>(TENANT_DATA_STORAGE_KEY);
        if (storedData) {
          setTenantDataState(storedData);
          const tenantInfo = convertToTenantInfo(storedData);
          setCurrentTenant(tenantInfo);
        }

        let storedConfig = getItem<TenantConfig>(TENANT_CONFIG_STORAGE_KEY);
        if (!storedConfig) {
          const { loadDefaultConfig } = await import('./utils');
          storedConfig = await loadDefaultConfig();
          await setItem(TENANT_CONFIG_STORAGE_KEY, storedConfig);
        }
        setTenantConfig(storedConfig);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load tenant')
        );
      } finally {
        setIsLoading(false);
      }
    }

    initializeTenant();
  }, []);

  function convertToTenantInfo(data: TenantApiResponse): TenantInfo {
    return {
      id: String(data.id),
      name: data.title,
      slug: data.subdomain,
      apiUrl: data.website_url,
      isActive: data.operational,
    };
  }

  async function fetchAndSetTenant(): Promise<TenantApiResponse> {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchTenantConfig();
      await setTenantData(data);
      return data;
    } catch (err) {
      const storedData = getItem<TenantApiResponse>(TENANT_DATA_STORAGE_KEY);
      if (storedData) {
        setTenantDataState(storedData);
        setCurrentTenant(convertToTenantInfo(storedData));
        return storedData;
      }
      const error =
        err instanceof Error ? err : new Error('Failed to fetch tenant');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function setTenantData(data: TenantApiResponse): Promise<void> {
    try {
      await setItem(TENANT_DATA_STORAGE_KEY, data);
      setTenantDataState(data);

      const tenantInfo = convertToTenantInfo(data);
      await setItem(TENANT_STORAGE_KEY, tenantInfo);
      setCurrentTenant(tenantInfo);

      const { loadDefaultConfig } = await import('./utils');
      const defaultConfig = await loadDefaultConfig();
      await setItem(TENANT_CONFIG_STORAGE_KEY, defaultConfig);
      setTenantConfig(defaultConfig);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to save tenant data')
      );
      throw err;
    }
  }

  async function setTenant(tenant: TenantInfo) {
    try {
      setIsLoading(true);
      setError(null);
      await setItem(TENANT_STORAGE_KEY, tenant);
      setCurrentTenant(tenant);
      await loadTenantConfig(tenant.id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to set tenant'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTenantConfig(tenantId: string) {
    try {
      setIsLoading(true);
      setError(null);

      const storedConfig = getItem<TenantConfig>(
        `${TENANT_CONFIG_STORAGE_KEY}_${tenantId}`
      );
      if (storedConfig) {
        setTenantConfig(storedConfig);
        setIsLoading(false);
        return;
      }

      const tenant = currentTenant || getItem<TenantInfo>(TENANT_STORAGE_KEY);
      if (tenant?.configUrl) {
        const response = await fetch(tenant.configUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        const config: TenantConfig = await response.json();
        await setItem(`${TENANT_CONFIG_STORAGE_KEY}_${tenantId}`, config);
        setTenantConfig(config);
      } else {
        const { loadDefaultConfig } = await import('./utils');
        const defaultConfig = await loadDefaultConfig();
        await setItem(
          `${TENANT_CONFIG_STORAGE_KEY}_${tenantId}`,
          defaultConfig
        );
        setTenantConfig(defaultConfig);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load tenant config')
      );
      if (!tenantConfig) {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearTenant() {
    setCurrentTenant(null);
    setTenantConfig(null);
    setTenantDataState(null);
    setError(null);
  }

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenantConfig,
        tenantData,
        isLoading,
        error,
        setTenant,
        setTenantData,
        fetchAndSetTenant,
        loadTenantConfig,
        clearTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
