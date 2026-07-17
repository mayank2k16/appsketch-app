/**
 * CMS categories domain types — ported from Vite's `Containers/Cms/Categories`
 * + `Api/cmsAPI.js`. Marketplace category fetch is dropped (no marketplace
 * support anywhere in this port, same precedent as every prior tab).
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
  parent: number | null;
  products: number[];
  sub_categories: CategoryNode[];
};

export type PickedCategoryAsset = { uri: string; name: string; type: string };

export type CategoryFormFields = {
  name: string;
  description: string;
  home_page: boolean;
  href_path: string;
  colour: string;
};

export type CreateCategoryPayload = CategoryFormFields & {
  category_id?: number; // set when creating a subcategory (parent id)
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
};

export type UpdateCategoryPayload = CategoryFormFields & {
  id: number;
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
};

export type AddSubCategoryPayload = CategoryFormFields & {
  category_id: number;
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
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
