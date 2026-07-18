import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { AiAssistantScreen } from './AiAssistant';
import { AnalyticsScreen } from './Analytics';
import { CategoriesScreen } from './Categories';
import { CollectionsScreen } from './Collections';
import { DiscountsScreen } from './Discounts';
import { InventoryScreen } from './Inventory';
import { InvoicesScreen } from './Invoices';
import { NotificationsScreen } from './Notifications';
import { OrdersScreen } from './Orders';
import { PaymentsScreen } from './Payments';
import { ProductRequestsScreen } from './ProductRequests';
import { ProductsScreen } from './Products';
import { ReferAndEarnScreen } from './ReferAndEarn';
import { StockHistoryScreen } from './StockHistory';
import { SupportScreen } from './Support';
import { UsersScreen } from './Users';
import { VendorsScreen } from './Vendors';
import { WalletsScreen } from './Wallets';

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
export type CmsTabKey =
  | 'orders'
  | 'inventory'
  | 'invoices'
  | 'categories'
  | 'collections'
  | 'discounts'
  | 'notifications'
  | 'payments'
  | 'wallets'
  | 'analytics'
  | 'products'
  | 'productRequests'
  | 'referAndEarn'
  | 'users'
  | 'stockHistory'
  | 'aiAssistant'
  | 'vendors'
  | 'support';

export type CmsTab = {
  key: CmsTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType<{ onMenuPress: () => void }>;
};

export const CMS_TABS: CmsTab[] = [
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', Component: OrdersScreen },
  { key: 'inventory', label: 'Inventory', icon: 'cube-outline', Component: InventoryScreen },
  { key: 'invoices', label: 'Invoices', icon: 'document-text-outline', Component: InvoicesScreen },
  { key: 'categories', label: 'Categories', icon: 'folder-outline', Component: CategoriesScreen },
  { key: 'collections', label: 'Collections', icon: 'albums-outline', Component: CollectionsScreen },
  { key: 'discounts', label: 'Discount Codes', icon: 'pricetag-outline', Component: DiscountsScreen },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', Component: NotificationsScreen },
  { key: 'payments', label: 'Payments', icon: 'card-outline', Component: PaymentsScreen },
  { key: 'wallets', label: 'Wallets', icon: 'wallet-outline', Component: WalletsScreen },
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline', Component: AnalyticsScreen },
  { key: 'products', label: 'Products', icon: 'pricetags-outline', Component: ProductsScreen },
  { key: 'productRequests', label: 'Product Requests', icon: 'checkmark-done-outline', Component: ProductRequestsScreen },
  { key: 'referAndEarn', label: 'Refer & Earn', icon: 'gift-outline', Component: ReferAndEarnScreen },
  { key: 'users', label: 'Users', icon: 'people-outline', Component: UsersScreen },
  { key: 'stockHistory', label: 'Stock History', icon: 'time-outline', Component: StockHistoryScreen },
  { key: 'aiAssistant', label: 'AI Assistant', icon: 'sparkles-outline', Component: AiAssistantScreen },
  { key: 'vendors', label: 'Vendors', icon: 'people-circle-outline', Component: VendorsScreen },
  { key: 'support', label: 'Support', icon: 'chatbubbles-outline', Component: SupportScreen },
];
