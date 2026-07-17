/**
 * CMS collections domain types — ported from Vite's
 * `Containers/Cms/Collections` + `Api/cmsAPI.js`.
 */

export type CollectionProduct = {
  id: number;
  product_name: string;
};

export type CollectionItem = {
  id: number;
  title: string;
  description?: string;
  priority?: number | string;
  active: boolean;
  image?: string | null;
  products_count?: number;
  products?: CollectionProduct[];
};

export type PickedCollectionAsset = { uri: string; name: string; type: string };

export type CollectionFormFields = {
  title: string;
  description: string;
  priority: string;
  active: boolean;
  product_ids: number[];
};

export type CreateCollectionPayload = CollectionFormFields & {
  image?: PickedCollectionAsset;
};

export type UpdateCollectionPayload = CollectionFormFields & {
  image?: PickedCollectionAsset;
};
