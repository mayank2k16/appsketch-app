import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { AbandonedCartsScreen } from './AbandonedCarts/AbandonedCartsScreen';
import { CheckoutOrdersScreen } from './CheckoutOrders/CheckoutOrdersScreen';

/**
 * Cart's own sub-tab registry — mirrors `Payments/tabs.tsx` one level
 * deeper. Merges two separate Vite top-level tabs (`AbandonedCarts`,
 * `CheckoutOrders`) that `SideBar.jsx` already groups under one expandable
 * "carts" submenu with a shared shopping-cart icon — same precedent as
 * `ReferAndEarn`.
 */
export type CartTabKey = 'abandonedCarts' | 'checkoutOrders';

export type CartTab = {
  key: CartTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType;
};

export const CART_TABS: CartTab[] = [
  { key: 'abandonedCarts', label: 'Abandoned Carts', icon: 'cart-outline', Component: AbandonedCartsScreen },
  { key: 'checkoutOrders', label: 'Checkout Orders', icon: 'cart-outline', Component: CheckoutOrdersScreen },
];
