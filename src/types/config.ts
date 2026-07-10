/**
 * Multi-tenant SaaS Storefront Configuration Schema
 * This defines the structure for JSON-driven UI configuration
 */

export type ComponentType =
  | 'container'
  | 'text'
  | 'image'
  | 'button'
  | 'product-grid'
  | 'product-card'
  | 'product-rail'
  | 'banner'
  | 'hero'
  | 'hero-carousel'
  | 'category-grid'
  | 'navigation'
  | 'cart'
  | 'checkout-form'
  | 'input'
  | 'search-bar'
  | 'filters'
  | 'wishlist-grid'
  | 'spacer'
  | 'divider'
  | 'skeleton';

export type LayoutType = 'stack' | 'grid' | 'row' | 'column' | 'scroll';

export type NavigationItem = {
  id: string;
  label: string;
  route: string;
  icon?: string;
};

export type ThemeConfig = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
};

export type ComponentConfig = {
  id: string;
  type: ComponentType;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: ComponentConfig[];
  conditions?: {
    show?: Record<string, unknown>;
  };
};

export type ScreenConfig = {
  id: string;
  route: string;
  title?: string;
  layout: LayoutType;
  components: ComponentConfig[];
  navigation?: {
    showHeader?: boolean;
    showBackButton?: boolean;
  };
};

export type TabVariant = 'main' | 'shop' | 'none';
export type HeaderStyle = 'default' | 'transparent';

export type NavigationConfig = {
  type: 'tabs' | 'stack' | 'drawer';
  tabVariant?: TabVariant;
  items: NavigationItem[];
  style?: Record<string, unknown>;
};

export type ScreenNavOptions = {
  showHeader?: boolean;
  showBackButton?: boolean;
  headerStyle?: HeaderStyle;
  showTabs?: boolean;
};

export type TenantConfig = {
  id: string;
  name: string;
  slug: string;
  version: string;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  screens: ScreenConfig[];
  metadata?: {
    logo?: string;
    favicon?: string;
    description?: string;
  };
};

export type TenantInfo = {
  id: string;
  name: string;
  slug: string;
  configUrl?: string;
  apiUrl?: string;
  isActive: boolean;
};

/**
 * Tenant API Response Types
 * These types capture the full response from api/account/tenant/
 */

export type InventoryStatus = {
  inventory_name: string;
  inventory_code: string;
  inventory_id: number;
  message: string;
};

export type TenantSettings = {
  domain: Record<string, unknown>;
  layout: Record<string, unknown>;
  payments: Record<string, unknown>;
  shipping: Record<string, unknown>;
};

export type SubMerchant = {
  id: number;
  _api_key: string;
  _api_secret: string;
  [key: string]: unknown;
};

export type TemplateConfigItem = {
  tenant_id: number;
  config: {
    cms_config?: {
      product_config?: Record<string, unknown>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  categories: number[];
  id: number;
};

export type TemplateDetails = {
  banner?: {
    heading?: string;
    [key: string]: unknown;
  };
  footer?: Record<string, unknown>;
  navbar?: string;
  [key: string]: unknown;
};

export type TenantApiResponse = {
  id: number;
  title: string;
  description: string;
  logo: string;
  address: string;
  business_details: Record<string, unknown> | null;
  clientele: unknown[];
  custom_domain: string;
  subdomain: string;
  default_delivery_charge: number;
  delivery_charge: number;
  operational: boolean;
  unoperational_message: string;
  start_time: string;
  tenant_category: number;
  website_url: string;
  workflow_config: number;
  uuid: string | null;
  server_time?: string;
  inventory_status: InventoryStatus;
  settings: TenantSettings;
  sub_merchant: SubMerchant;
  template_configs: TemplateConfigItem[];
  template_details: TemplateDetails;
};
