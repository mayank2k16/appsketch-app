# Multi-Tenant SaaS Storefront Architecture

This application is built as a multi-tenant, cross-platform SaaS storefront where the entire UI and user experience are dynamically rendered from a JSON configuration.

## Architecture Overview

### Core Concepts

1. **Tenant Isolation**: Each tenant (brand, merchant, or business) runs a fully isolated storefront from a single codebase
2. **Config-Driven UI**: All UI components, layouts, themes, and navigation are defined by a versioned JSON schema
3. **Runtime Rendering**: The app fetches and renders tenant configurations at runtime without requiring app redeployment
4. **Cross-Platform**: Consistent rendering across Web, Android, and iOS

## Project Structure

```
src/
├── api/
│   └── tenants/          # API hooks for tenant management
├── app/
│   ├── tenant-selector.tsx    # Tenant selection screen
│   └── storefront/             # Config-driven storefront screens
│       ├── _layout.tsx
│       ├── index.tsx          # Home screen
│       ├── products.tsx
│       ├── cart.tsx
│       └── checkout.tsx
├── components/
│   └── ui/                # Base UI components
├── configs/
│   └── default-ecommerce.json  # Default e-commerce template config
├── lib/
│   ├── config-renderer/   # Config rendering engine
│   │   ├── component-registry.tsx
│   │   ├── renderer.tsx
│   │   └── components/    # Config-driven components
│   ├── store/
│   │   └── cart-store.tsx  # Cart state management
│   └── tenant/            # Tenant management
│       ├── context.tsx
│       └── utils.tsx
└── types/
    └── config.ts          # TypeScript types for config schema
```

## Configuration Schema

The tenant configuration follows a structured JSON schema defined in `src/types/config.ts`:

### Key Types

- **TenantConfig**: Complete tenant configuration including theme, navigation, and screens
- **ScreenConfig**: Individual screen definition with layout and components
- **ComponentConfig**: Reusable component definition with props and styling
- **ThemeConfig**: Theme configuration with colors, fonts, spacing, and border radius

### Example Configuration

See `src/configs/default-ecommerce.json` for a complete example of an e-commerce storefront configuration.

## Component Registry

The component registry (`src/lib/config-renderer/component-registry.tsx`) maps configuration component types to React components:

- `container`: Layout container
- `text`: Text display with variants (h1-h4, body, caption)
- `image`: Image display
- `button`: Interactive button
- `product-grid`: Grid of product cards
- `product-card`: Individual product card
- `banner`: Promotional banner
- `hero`: Hero section with CTA
- `navigation`: Navigation bar
- `cart`: Shopping cart display
- `checkout-form`: Checkout form
- `input`: Form input
- `spacer`: Spacing element
- `divider`: Visual divider

## Tenant Management

### TenantProvider

The `TenantProvider` (`src/lib/tenant/context.tsx`) manages:
- Current tenant selection
- Tenant configuration loading (from storage or API)
- Configuration caching
- Error handling

### Usage

```tsx
import { useTenant } from '@/lib/tenant';

function MyComponent() {
  const { currentTenant, tenantConfig, setTenant } = useTenant();
  // ...
}
```

## Config Renderer

The `ConfigRenderer` (`src/lib/config-renderer/renderer.tsx`) interprets the JSON configuration and renders React Native components:

1. Reads screen configuration
2. Maps component types to React components via registry
3. Applies props and styling from config
4. Handles nested component hierarchies
5. Supports conditional rendering (future enhancement)

## Default E-commerce Template

The default template (`src/configs/default-ecommerce.json`) includes:

- **Home Screen**: Hero section, featured products grid, promotional banner
- **Products Screen**: Full product catalog grid
- **Cart Screen**: Shopping cart with quantity management
- **Checkout Screen**: Complete checkout form

### Features

- Product catalog with images, titles, and prices
- Shopping cart functionality
- Checkout flow
- Responsive grid layouts
- Theme customization

## State Management

### Cart Store

The cart is managed using Zustand (`src/lib/store/cart-store.tsx`):

- Add/remove items
- Update quantities
- Calculate totals
- Clear cart

## API Integration

### Tenant API

The API layer (`src/api/tenants/index.ts`) provides:

- `useTenantConfig`: Fetch tenant configuration
- `useTenants`: List available tenants
- `useTenantById`: Get tenant by ID

### Configuration Fetching

Configurations can be loaded from:
1. Local storage (cached)
2. Remote API endpoint (via `configUrl`)
3. Local JSON file (default template)

## Adding New Components

To add a new component type:

1. Create component in `src/lib/config-renderer/components/`
2. Add to component registry in `src/lib/config-renderer/component-registry.tsx`
3. Add type to `ComponentType` in `src/types/config.ts`
4. Update default config JSON if needed

Example:

```tsx
// src/lib/config-renderer/components/my-component.tsx
export function MyComponent({ config }: { config: ComponentConfig }) {
  const { props } = config;
  return <View>{/* Your component */}</View>;
}

// src/lib/config-renderer/component-registry.tsx
export const componentRegistry = {
  // ... existing components
  'my-component': MyComponent,
};
```

## Theming

Themes are defined in the tenant configuration and include:

- Colors (primary, secondary, background, text, etc.)
- Fonts (heading, body)
- Spacing scale
- Border radius values

Components can access theme via the `useTenant` hook:

```tsx
const { tenantConfig } = useTenant();
const primaryColor = tenantConfig?.theme.colors.primary;
```

## Future Enhancements

- [ ] Condition evaluation engine for conditional rendering
- [ ] Plugin system for custom components
- [ ] Version management for configurations
- [ ] A/B testing support
- [ ] Analytics integration
- [ ] Payment gateway integrations
- [ ] Product detail pages
- [ ] User authentication per tenant
- [ ] Multi-language support per tenant

## Usage

1. **Start the app**: The app will show the tenant selector
2. **Select a tenant**: Choose "Use Default E-commerce Store" to load the default template
3. **Browse storefront**: Navigate through the config-driven UI
4. **Customize**: Modify `src/configs/default-ecommerce.json` to customize the storefront

## Development

### Running the App

```bash
pnpm start
```

### Adding a New Tenant

1. Create a new JSON config file in `src/configs/`
2. Add tenant info to your backend API
3. Update tenant selector to include new tenant option

### Testing

The architecture supports:
- Unit testing of components
- Integration testing of config renderer
- E2E testing of storefront flows

