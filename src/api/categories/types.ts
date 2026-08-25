/**
 * CMS categories domain types — ported from Vite's `Containers/Cms/Categories`
 * + `Api/cmsAPI.js`.
 */

export type CategoryNode = {
  id: number;
  name: string;
  description?: string;
  home_page: boolean;
  href_path?: string;
  colour?: string;
  image?: string | null;
  banner_image?: string | null;
  icon?: string | null;
  background_image?: string | null;
  parent: number | null;
  // Sort rank driving both root and subcategory order; NULL sorts last. Set
  // by POST api/shop/categories/reorder/, never edited directly by the UI.
  priority?: number | null;
  products: number[];
  sub_categories: CategoryNode[];
  /** Owning vendor's tenant id — only present on rows returned by
   * `fetchMarketplaceCategories`, absent for a plain single-tenant fetch.
   * Same convention as `ProductListItem.sold_by_id`/`.tenant_id`. */
  tenant?: number;
};

export type PickedCategoryAsset = { uri: string; name: string; type: string };

export type CategoryFormFields = {
  name: string;
  description: string;
  home_page: boolean;
  href_path: string;
  colour: string;
  // Lower number = shown first; "" clears the ranking back to NULL
  // (unranked, sorts last). Sent as a string — mirrors the web CMS's
  // `priority` field on `shop.Category`, usually set by dragging cards.
  priority: string;
};

export type CreateCategoryPayload = CategoryFormFields & {
  category_id?: number; // set when creating a subcategory (parent id)
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
  background_image?: PickedCategoryAsset;
};

export type UpdateCategoryPayload = CategoryFormFields & {
  id: number;
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
  background_image?: PickedCategoryAsset;
};

export type AddSubCategoryPayload = CategoryFormFields & {
  category_id: number;
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
  background_image?: PickedCategoryAsset;
};

export type DeleteCategoryAtAnyLevelPayload = {
  id: number;
  parent: number | null;
  category_id?: number;
};

export type LinkProductPayload = {
  category_id: number;
  product_id: number[];
};

export type UnlinkProductPayload = {
  category_id: number;
  id: number;
};

// `parentId`/`from`/`to` are not sent over the wire — the client-side
// optimistic update needs them to know which sibling group to rewrite.
// `ids` is the full reordered sibling list; the server reindexes priority
// from 0 over exactly the ids it receives (see backend `CategorySerializer`,
// which already orders `sub_categories` by `priority` nulls-last).
export type ReorderCategoriesPayload = {
  ids: number[];
  parentId: number | null;
  from: number;
  to: number;
};

export type ReorderCategoryProductsPayload = {
  category_id: number;
  product_ids: number[];
};
