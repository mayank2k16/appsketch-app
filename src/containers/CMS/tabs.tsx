import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { InventoryScreen } from './Inventory';
import { NotificationsScreen } from './Notifications';
import { OrdersScreen } from './Orders';

/**
 * Data-driven tab registry — the single place to add a new CMS tab. Mirrors
 * the data-driven `SECTIONS` array already used in
 * `src/containers/Studio/StudioScreen.tsx`, in place of Vite's
 * `TenantDashboard.jsx` which instead hand-writes a long chain of
 * `{activeComponent === "X" && <Component/>}` JSX conditionals per tab.
 *
 * Tabs are conditionally *mounted* (only the active one renders, so only its
 * data-fetching effects run) rather than code-split with `React.lazy` — see
 * the CMS shell architecture plan for why.
 */
export type CmsTabKey = 'orders' | 'inventory' | 'notifications';

export type CmsTab = {
  key: CmsTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType<{ onMenuPress: () => void }>;
};

export const CMS_TABS: CmsTab[] = [
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', Component: OrdersScreen },
  { key: 'inventory', label: 'Inventory', icon: 'cube-outline', Component: InventoryScreen },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', Component: NotificationsScreen },
];
