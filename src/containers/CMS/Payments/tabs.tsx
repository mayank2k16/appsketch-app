import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { BulkPaymentsScreen } from './BulkPayments/BulkPaymentsScreen';
import { RegularPaymentsScreen } from './RegularPayments/RegularPaymentsScreen';
import { VendorSettlementsScreen } from './VendorSettlements/VendorSettlementsScreen';

/**
 * Payments' own sub-tab registry — mirrors `Notifications/tabs.tsx` one
 * level deeper, matching the Vite reference's sidebar sub-menu (Regular
 * Payments, Bulk Payments, Vendor Settlements).
 */
export type PaymentTabKey = 'regularPayments' | 'bulkPayments' | 'vendorSettlements';

export type PaymentTab = {
  key: PaymentTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType;
};

export const PAYMENT_TABS: PaymentTab[] = [
  { key: 'regularPayments', label: 'Regular Payments', icon: 'card-outline', Component: RegularPaymentsScreen },
  { key: 'bulkPayments', label: 'Bulk Payments', icon: 'layers-outline', Component: BulkPaymentsScreen },
  { key: 'vendorSettlements', label: 'Vendor Settlements', icon: 'business-outline', Component: VendorSettlementsScreen },
];
