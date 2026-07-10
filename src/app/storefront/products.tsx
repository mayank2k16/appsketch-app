import * as React from 'react';

import { ConfigRenderer } from '@/lib/config-renderer/renderer';
import { useTenant } from '@/lib/tenant';

export default function ProductsScreen() {
  const { tenantConfig, isLoading } = useTenant();

  if (isLoading || !tenantConfig) {
    return null;
  }

  const productsScreen = tenantConfig.screens.find((screen) => screen.route === '/products');

  if (!productsScreen) {
    return null;
  }

  return <ConfigRenderer screenConfig={productsScreen} />;
}
