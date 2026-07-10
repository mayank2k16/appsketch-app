import { getItem, setItem } from '@/lib/storage';
import type { TenantConfig } from '@/types/config';

const DEFAULT_CONFIG_KEY = 'default_tenant_config';

export async function loadDefaultConfig(): Promise<TenantConfig> {
  // Try to load from storage first
  const stored = getItem<TenantConfig>(DEFAULT_CONFIG_KEY);
  if (stored) {
    return stored;
  }

  // Load from local JSON file
  // Note: In React Native/Expo, JSON files are bundled at build time
  // The require() will be resolved by Metro bundler
  const defaultConfig = require('@/configs/default-ecommerce.json') as TenantConfig;
  await setItem(DEFAULT_CONFIG_KEY, defaultConfig);
  return {};
}

export function getDefaultTenant() {
  return {
    id: 'default-ecommerce',
    name: 'Default E-commerce Store',
    slug: 'default-store',
    isActive: true,
  };
}

