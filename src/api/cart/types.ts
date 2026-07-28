/**
 * CMS "Cart" domain — merges two sidebar-grouped Vite tabs into one nested
 * shell (`SideBar.jsx`'s "carts" submenu groups them under one shopping-cart
 * icon): `AbandonedCarts` (active carts never taken to checkout) and
 * `CheckoutOrders` (checkouts started but not yet paid/placed). Both are
 * read-only lists; the only mutation anywhere is discarding an abandoned cart.
 */

import type { OrderAddress, OrderCustomer } from '@/api/orders';

export type AbandonedCartItem = {
  id: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  item_count: number;
  total_price: string | number;
  created_on: string;
  updated_on: string;
};

export type CheckoutOrderItem = {
  id: number;
  created_on: string;
  customer?: OrderCustomer | null;
  total_price: string | number;
  address?: OrderAddress | null;
};
