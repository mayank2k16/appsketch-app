import * as React from 'react';

import { ConfigRenderer } from '@/lib/config-renderer/renderer';
import { useTenant } from '@/lib/tenant';

export default function CheckoutScreen() {
  const { tenantConfig, isLoading } = useTenant();

  if (isLoading || !tenantConfig) {
    return null;
  }

  const checkoutScreen = tenantConfig.screens.find((screen) => screen.route === '/checkout');

  if (!checkoutScreen) {
    return null;
  }

  return <ConfigRenderer screenConfig={checkoutScreen} />;
}
