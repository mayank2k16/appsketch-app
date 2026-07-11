/**
 * Products — ported from Vite's `Containers/Cms/Products`. Phase 1 (this
 * port): media, basic details, category, manufacturer, tags, and
 * variants/combinations — the fields every product needs. Deferred to a
 * follow-up: Amenities/FAQs/Key Benefits/Specifications/Ingredients/
 * Customer Feedback/Custom HTML — all optional marketing content Vite
 * stores in the same free-form `attributes` JSON blob this port already
 * writes `tags`/`features` into, so adding them later is additive, not a
 * restructure.
 */

/** Canonical shape returned by the backend for a resolved variant option —
 * matches what Vite's own `initializeData` reads back (`type_name`/
 * `option_value`), used as the single option shape end-to-end here instead
 * of also round-tripping through Vite's inconsistent `variant_options`
 * write shape (`variant_type`/`variant_value`) for the same data. */
export type ProductVariationOption = {
  type_name: string;
  option_value: string;
};

export type MediaDisplayPriority = 'IMAGES' | 'VIDEOS';

export type ProductVariant = {
  id?: number;
  variant_type: string;
  variant_value: string;
  primary_image: string;
  images: string[];
  videos: string[];
  media_display_priority: MediaDisplayPriority;
  price: string | number;
  market_price: string | number;
  quantity: string | number;
  variation_options: ProductVariationOption[];
};

export type ProductCategory = { id: number; name: string };
export type ProductManufacturer = { id: number; name: string };
export type ProductInventoryOption = { id: number; name: string };

export type SellableInventory = {
  price?: string | number;
  market_price?: string | number;
  quantity_remaining?: string | number;
};

export type ProductListItem = {
  id: number;
  product_name: string;
  description?: string;
  catalogue_number?: string;
  previous_catalogue_number?: string;
  alternate_names?: string[] | null;
  manufacturer?: ProductManufacturer | null;
  images?: string[];
  photo?: string;
  videos?: string[];
  sellable_inventory?: SellableInventory;
  media_display_priority?: MediaDisplayPriority;
  features?: string[];
  tags?: string[];
  categories?: ProductCategory[];
  variants?: ProductVariant[];
};

/** Structured input the screen builds up; `client.ts` serializes this into
 * the multipart `FormData` the backend expects (same field names as Vite's
 * `handleSubmit`, `attributes` narrowed to just the Phase-1 keys). */
export type SaveProductInput = {
  id?: number;
  product_name: string;
  description: string;
  catalogue_number: string;
  previous_catalogue_number: string;
  alternate_names: string[];
  manufacturer: number | '';
  images: string[];
  photo: string;
  videos: string[];
  media_display_priority: MediaDisplayPriority | '';
  price: string;
  market_price: string;
  quantity: string;
  categories: number[];
  features: string[];
  tags: string[];
  variants: ProductVariant[];
};

export type CreateManufacturerPayload = { name: string; is_active: true };
