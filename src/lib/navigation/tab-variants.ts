/**
 * Tab variants for config-driven navigation
 * Different tab layouts per context (main app, shop, none)
 */

import type { TabVariant } from './screen-options';

export type TabItemConfig = {
  id: string;
  label: string;
  route: string;
  screenName: string;
  icon: string;
};

export const TAB_VARIANTS: Record<
  TabVariant,
  { items: TabItemConfig[] }
> = {
  main: {
    items: [
      { id: 'home', label: 'Home', route: '/', screenName: 'index', icon: 'home' },
      { id: 'explore', label: 'Explore', route: '/explore', screenName: 'explore', icon: 'search' },
      { id: 'wishlist', label: 'Wishlist', route: '/wishlist', screenName: 'wishlist', icon: 'heart' },
      { id: 'profile', label: 'Profile', route: '/profile', screenName: 'profile', icon: 'user' },
    ],
  },
  shop: {
    items: [
      { id: 'products', label: 'Products', route: '/products', screenName: 'products', icon: 'shop' },
      { id: 'categories', label: 'Categories', route: '/categories', screenName: 'categories', icon: 'category' },
      { id: 'cart', label: 'Cart', route: '/cart', screenName: 'cart', icon: 'cart' },
    ],
  },
  none: {
    items: [],
  },
};
