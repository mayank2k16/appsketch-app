import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { AiAssistantScreen } from './AiAssistant';
import { AnalyticsScreen } from './Analytics';
import { BookingsScreen } from './Bookings';
import { CartScreen } from './Cart';
import { CategoriesScreen } from './Categories';
import { CollectionsScreen } from './Collections';
import { CreditDebitNotesScreen } from './CreditDebitNotes';
import { DiscountsScreen } from './Discounts';
import { InventoryScreen } from './Inventory';
import { InvoicesScreen } from './Invoices';
import { NotificationsScreen } from './Notifications';
import { OrdersScreen } from './Orders';
import { PaymentsScreen } from './Payments';
import { ProductRequestsScreen } from './ProductRequests';
import { ProductsScreen } from './Products';
import { ReferAndEarnScreen } from './ReferAndEarn';
import { ShortVideosScreen } from './ShortVideos';
import { StockHistoryScreen } from './StockHistory';
import { StoriesScreen } from './Stories';
import { SupportScreen } from './Support';
import { UsersScreen } from './Users';
import { VendorsScreen } from './Vendors';
import { WalletsScreen } from './Wallets';

export type CmsTabKey =
  | 'orders'
  | 'bookings'
  | 'inventory'
  | 'invoices'
  | 'categories'
  | 'cart'
  | 'collections'
  | 'stories'
  | 'creditDebitNotes'
  | 'discounts'
  | 'notifications'
  | 'payments'
  | 'wallets'
  | 'analytics'
  | 'products'
  | 'productRequests'
  | 'referAndEarn'
  | 'shortVideos'
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

type CmsTenantType = 'marketplace' | 'appointment';

/** Plain e-commerce tenant (no `tenant_type`, or an unrecognized value). */
const DEFAULT_TAB_KEYS: CmsTabKey[] = [
  'analytics',
  'orders',
  'inventory',
  'invoices',
  'categories',
  'cart',
  'collections',
  'stories',
  'creditDebitNotes',
  'discounts',
  'notifications',
  'payments',
  'wallets',
  'products',
  'referAndEarn',
  'shortVideos',
  'users',
  'stockHistory',
  'aiAssistant',
  'support',
];

const TENANT_TYPE_TAB_KEYS: Record<CmsTenantType, CmsTabKey[]> = {
  marketplace: [...DEFAULT_TAB_KEYS, 'vendors', 'productRequests'],
  appointment: [
    ...DEFAULT_TAB_KEYS.filter((key) => key !== 'orders' && key !== 'stockHistory' && key !== 'creditDebitNotes'),
    'bookings',
  ],
};

export function getVisibleCmsTabs(tenantType: string | null | undefined): CmsTab[] {
  const allowedKeys = new Set(
    tenantType && tenantType in TENANT_TYPE_TAB_KEYS
      ? TENANT_TYPE_TAB_KEYS[tenantType as CmsTenantType]
      : DEFAULT_TAB_KEYS
  );
  return CMS_TABS.filter((tab) => allowedKeys.has(tab.key));
}

export const CMS_TABS: CmsTab[] = [
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline', Component: AnalyticsScreen },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', Component: OrdersScreen },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-outline', Component: BookingsScreen },
  { key: 'inventory', label: 'Inventory', icon: 'cube-outline', Component: InventoryScreen },
  { key: 'invoices', label: 'Invoices', icon: 'document-text-outline', Component: InvoicesScreen },
  { key: 'categories', label: 'Categories', icon: 'folder-outline', Component: CategoriesScreen },
  { key: 'cart', label: 'Cart', icon: 'cart-outline', Component: CartScreen },
  { key: 'collections', label: 'Collections', icon: 'albums-outline', Component: CollectionsScreen },
  { key: 'stories', label: 'Stories', icon: 'book-outline', Component: StoriesScreen },
  { key: 'creditDebitNotes', label: 'Credit/Debit Notes', icon: 'swap-horizontal-outline', Component: CreditDebitNotesScreen },
  { key: 'discounts', label: 'Discount Codes', icon: 'pricetag-outline', Component: DiscountsScreen },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', Component: NotificationsScreen },
  { key: 'payments', label: 'Payments', icon: 'card-outline', Component: PaymentsScreen },
  { key: 'wallets', label: 'Wallets', icon: 'wallet-outline', Component: WalletsScreen },
  { key: 'products', label: 'Products', icon: 'pricetags-outline', Component: ProductsScreen },
  { key: 'productRequests', label: 'Product Requests', icon: 'checkmark-done-outline', Component: ProductRequestsScreen },
  { key: 'referAndEarn', label: 'Refer & Earn', icon: 'gift-outline', Component: ReferAndEarnScreen },
  { key: 'shortVideos', label: 'Short Videos', icon: 'videocam-outline', Component: ShortVideosScreen },
  { key: 'users', label: 'Users', icon: 'people-outline', Component: UsersScreen },
  { key: 'stockHistory', label: 'Stock History', icon: 'time-outline', Component: StockHistoryScreen },
  { key: 'aiAssistant', label: 'AI Assistant', icon: 'sparkles-outline', Component: AiAssistantScreen },
  { key: 'vendors', label: 'Vendors', icon: 'people-circle-outline', Component: VendorsScreen },
  { key: 'support', label: 'Support', icon: 'chatbubbles-outline', Component: SupportScreen },
];

if (__DEV__) {
  const coveredKeys = new Set<CmsTabKey>([
    ...DEFAULT_TAB_KEYS,
    ...TENANT_TYPE_TAB_KEYS.marketplace,
    ...TENANT_TYPE_TAB_KEYS.appointment,
  ]);
  const uncoveredKeys = CMS_TABS.map((tab) => tab.key).filter((key) => !coveredKeys.has(key));
  if (uncoveredKeys.length > 0) {
    console.warn(
      `[CMS] tabs.tsx: tab(s) not in DEFAULT_TAB_KEYS or any TENANT_TYPE_TAB_KEYS entry — ` +
      `they will never render for any tenant type: ${uncoveredKeys.join(', ')}`
    );
  }
}
