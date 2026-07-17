import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type {
  AddSubCategoryPayload,
  CategoryNode,
  CreateCategoryPayload,
  DeleteCategoryAtAnyLevelPayload,
  LinkProductPayload,
  PickedCategoryAsset,
  UnlinkProductPayload,
  UpdateCategoryPayload,
} from './types';

// Named `fetchCategoryTree` (not `fetchCategories`) — `@/api/home` already
// exports `fetchCategories`/`useCategories` for the public storefront's flat
// category browser, a different consumer/shape (recursive admin tree here
// vs. flat public list there), and both domains are flat-barrel-exported
// from `src/api/index.tsx`.
export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  const { data } = await authenticatedClient.get<CategoryNode[]>('api/shop/tenant/categories/all/');
  return data ?? [];
}

async function appendFile(formData: FormData, field: string, asset: PickedCategoryAsset) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    formData.append(field, blob, asset.name);
  } else {
    // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
    formData.append(field, asset);
  }
}

async function buildCategoryFormData(payload: {
  name: string;
  description: string;
  home_page: boolean;
  href_path: string;
  colour: string;
  category_id?: number;
  id?: number;
  image?: PickedCategoryAsset;
  banner_image?: PickedCategoryAsset;
  icon?: PickedCategoryAsset;
}): Promise<FormData> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('home_page', String(payload.home_page));
  formData.append('href_path', payload.href_path);
  formData.append('colour', payload.colour.toLowerCase());
  if (payload.category_id !== undefined) formData.append('category_id', String(payload.category_id));
  if (payload.id !== undefined) formData.append('id', String(payload.id));
  if (payload.image) await appendFile(formData, 'image', payload.image);
  if (payload.banner_image) await appendFile(formData, 'banner_image', payload.banner_image);
  if (payload.icon) await appendFile(formData, 'icon', payload.icon);
  return formData;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryNode> {
  const formData = await buildCategoryFormData(payload);
  const { data } = await authenticatedClient.post<CategoryNode>('api/shop/post/add_category/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateCategory(payload: UpdateCategoryPayload): Promise<CategoryNode> {
  const formData = await buildCategoryFormData(payload);
  const { data } = await authenticatedClient.patch<CategoryNode>('api/shop/tenant/categories/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function addSubCategory(payload: AddSubCategoryPayload): Promise<CategoryNode> {
  const formData = await buildCategoryFormData(payload);
  const { data } = await authenticatedClient.put<CategoryNode>('api/shop/category/subcategory/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteCategoryAtAnyLevel(payload: DeleteCategoryAtAnyLevelPayload): Promise<void> {
  if (payload.parent) {
    await authenticatedClient.delete('api/shop/category/subcategory/', {
      data: { category_id: payload.category_id ?? payload.parent, id: payload.id },
    });
  } else {
    await authenticatedClient.delete('api/shop/tenant/categories/', { data: { id: payload.id } });
  }
}

export async function deleteProductFromCategory(payload: UnlinkProductPayload): Promise<void> {
  await authenticatedClient.delete('api/shop/category/product/', { data: payload });
}

export async function linkProductToCategory(payload: LinkProductPayload): Promise<void> {
  await authenticatedClient.put('api/shop/category/product/', payload);
}
