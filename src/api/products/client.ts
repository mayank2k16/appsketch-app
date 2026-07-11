import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type {
  CreateManufacturerPayload,
  ProductCategory,
  ProductInventoryOption,
  ProductListItem,
  ProductManufacturer,
  SaveProductInput,
} from './types';

export async function fetchProducts(): Promise<ProductListItem[]> {
  const { data } = await authenticatedClient.get<ProductListItem[]>('api/shop/products/all/');
  return data ?? [];
}

export async function deleteProduct(id: number): Promise<void> {
  await authenticatedClient.delete('api/shop/tenant/products/', { data: { id } });
}

export async function fetchLeafCategories(): Promise<ProductCategory[]> {
  const { data } = await authenticatedClient.get<{ data: ProductCategory[] }>(
    'api/shop/categories/leaf/'
  );
  return data.data ?? [];
}

export async function fetchProductInventories(): Promise<ProductInventoryOption[]> {
  const { data } = await authenticatedClient.get<{ message: ProductInventoryOption[] }>(
    'api/shop/inventories/'
  );
  return data.message ?? [];
}

export async function fetchManufacturers(): Promise<ProductManufacturer[]> {
  const { data } = await authenticatedClient.get<ProductManufacturer[]>('api/shop/manufacturers/');
  return data ?? [];
}

export async function createManufacturer(name: string): Promise<ProductManufacturer> {
  const payload: CreateManufacturerPayload = { name, is_active: true };
  const { data } = await authenticatedClient.post<ProductManufacturer>(
    'api/shop/manufacturers/',
    payload
  );
  return data;
}

/** Picked-asset shape both the primary-image field and the images/videos
 * galleries upload through. */
export type PickedMediaAsset = { uri: string; name: string; type: string };

export async function uploadProductMedia(asset: PickedMediaAsset): Promise<string> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // RN Web's FormData is the real DOM one — it needs an actual Blob/File,
    // not the {uri,name,type} triple the native bridge understands. Picker
    // URIs on web are already `blob:`/`data:`, so re-fetching them locally
    // (no network hop) gets us that Blob.
    const blob = await (await fetch(asset.uri)).blob();
    formData.append('image', blob, asset.name);
  } else {
    // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
    formData.append('image', asset);
  }
  const { data } = await authenticatedClient.post<string>('api/shop/upload_image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function saveProduct(input: SaveProductInput): Promise<ProductListItem> {
  const formData = new FormData();
  formData.append('product_name', input.product_name);
  formData.append('description', input.description);
  formData.append('catalogue_number', input.catalogue_number);
  formData.append('previous_catalogue_number', input.previous_catalogue_number ?? '');
  formData.append('alternate_names', JSON.stringify(input.alternate_names));
  formData.append('manufacturer', String(input.manufacturer ?? ''));
  formData.append('images', JSON.stringify(input.images));
  formData.append('photo', input.photo ?? '');
  formData.append('videos', JSON.stringify(input.videos));
  formData.append('media_display_priority', input.media_display_priority);
  formData.append('price', input.price ?? '');
  formData.append('market_price', input.market_price ?? '');
  formData.append('quantity', input.quantity ?? '');
  formData.append('categories', JSON.stringify(input.categories));
  formData.append('variants', JSON.stringify(input.variants));
  formData.append('attributes', JSON.stringify({ tags: input.tags, features: input.features }));
  if (input.id) {
    formData.append('id', String(input.id));
  }

  const { data } = await authenticatedClient.patch<ProductListItem>(
    'api/shop/tenant/products/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}
