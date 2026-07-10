/**
 * Config-driven navigation: header and tab visibility per screen
 * Tenant-ready for future navigation customization
 */

export type HeaderStyle = 'default' | 'transparent';
export type TabVariant = 'main' | 'shop' | 'none';

export type ScreenNavConfig = {
  showHeader: boolean;
  showBackButton?: boolean;
  headerStyle?: HeaderStyle;
  showTabs: boolean;
  title?: string;
};

const DEFAULT_HEADER = { showHeader: true, showBackButton: false, headerStyle: 'default' as HeaderStyle };
const NO_HEADER = { showHeader: false };
const TRANSPARENT_HEADER = { ...NO_HEADER, headerStyle: 'transparent' as HeaderStyle };

/**
 * Screen-level navigation config.
 * Keys match storefront route names (index, explore, wishlist, profile, categories, cart, checkout, [id], terms, privacy).
 */
export const SCREEN_NAV_CONFIG: Record<string, ScreenNavConfig> = {
  index: {
    ...DEFAULT_HEADER,
    showTabs: true,
    title: 'Home',
  },
  explore: {
    ...DEFAULT_HEADER,
    showTabs: true,
    title: 'Explore',
  },
  wishlist: {
    ...DEFAULT_HEADER,
    showTabs: true,
    title: 'Wishlist',
  },
  profile: {
    ...DEFAULT_HEADER,
    showTabs: true,
    title: 'Profile',
  },
  categories: {
    ...DEFAULT_HEADER,
    showHeader: true,
    showBackButton: true,
    showTabs: false,
    title: 'Categories',
  },
  cart: {
    ...DEFAULT_HEADER,
    showHeader: true,
    showBackButton: true,
    showTabs: false,
    title: 'Cart',
  },
  checkout: {
    ...NO_HEADER,
    showTabs: false,
    title: 'Checkout',
  },
  '[id]': {
    ...TRANSPARENT_HEADER,
    showHeader: false,
    showTabs: false,
    title: 'Product Details',
  },
  terms: {
    ...DEFAULT_HEADER,
    showBackButton: true,
    showTabs: false,
    title: 'Terms & Conditions',
  },
  privacy: {
    ...DEFAULT_HEADER,
    showBackButton: true,
    showTabs: false,
    title: 'Privacy Policy',
  },
  products: {
    ...DEFAULT_HEADER,
    showTabs: false,
    title: 'Products',
  },
};

export function getScreenNavConfig(routeName: string): ScreenNavConfig {
  return (
    SCREEN_NAV_CONFIG[routeName] ?? {
      ...DEFAULT_HEADER,
      showTabs: false,
    }
  );
}
