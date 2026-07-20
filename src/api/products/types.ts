/**
 * Products — ported from Vite's `Containers/Cms/Products`. Phase 1 shipped
 * media/basic details/category/manufacturer/tags/variants. Phase 2 (this
 * update) adds the remaining `attributes`-blob marketing content — Amenities,
 * FAQs, Key Benefits, Specifications, Ingredients, Customer Feedback, Custom
 * HTML, How to Use, Benefits (Detailed) — and fixes `saveProduct` to
 * round-trip the *whole* `attributes` blob instead of overwriting it with
 * just `{tags, features}` (which was silently deleting all of the above on
 * every edit).
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

export type FaqItem = { question: string; answer: string };
export type AmenityItem = { image?: string; title: string; description?: string };
export type KeyBenefitItem = { icon?: string; title: string; description?: string };
export type SpecificationItem = { label: string; value: string };
export type IngredientRow = { ingredient: string; strength?: string; benefit?: string };
export type IngredientsBlock = {
  heading?: string;
  table: IngredientRow[];
  prebiotic_support?: string;
  other_ingredients?: string;
};
export type FeedbackItem = {
  rating: number;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  user_id?: number;
  user_name?: string;
};

/** The optional-marketing-content keys the backend stores in one free-form
 * JSON blob — read back nested under `attributes` (matches Vite's
 * `initializeData`), but sent flat on `SaveProductInput` since that's
 * already the pre-serialization shape this port uses for `tags`/`features`. */
export type ProductAttributes = {
  key_benefits?: KeyBenefitItem[];
  specifications?: SpecificationItem[];
  ingredients?: IngredientsBlock;
  custom_html?: string;
  how_to_use?: string;
  benefits_detail?: string;
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
  /** Top-level on read, even though written nested under `attributes.feedback.reviews`
   * — same response-shape-differs-from-write-shape pattern documented across this
   * port; ported faithfully rather than "fixed" since it's what the backend does. */
  faqs?: FaqItem[];
  amenities?: AmenityItem[];
  feedbacks?: FeedbackItem[];
  attributes?: ProductAttributes;
};

/** Structured input the screen builds up; `client.ts` serializes this into
 * the multipart `FormData` the backend expects (same field names as Vite's
 * `handleSubmit`). */
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
  faqs: FaqItem[];
  amenities: AmenityItem[];
  key_benefits: KeyBenefitItem[];
  specifications: SpecificationItem[];
  ingredients: IngredientsBlock;
  feedbacks: FeedbackItem[];
  custom_html: string;
  how_to_use: string;
  benefits_detail: string;
};

export type CreateManufacturerPayload = { name: string; is_active: true };
