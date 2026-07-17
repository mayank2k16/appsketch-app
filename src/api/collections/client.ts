import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type {
  CollectionItem,
  CreateCollectionPayload,
  PickedCollectionAsset,
  UpdateCollectionPayload,
} from './types';

export async function fetchCollections(): Promise<CollectionItem[]> {
  const { data } = await authenticatedClient.get<{ results?: CollectionItem[] } | CollectionItem[]>(
    'api/shop/collections/'
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

async function buildCollectionFormData(payload: {
  title: string;
  description: string;
  priority: string;
  active: boolean;
  product_ids: number[];
  image?: PickedCollectionAsset;
}): Promise<FormData> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('priority', payload.priority);
  formData.append('active', String(payload.active));
  for (const id of payload.product_ids) {
    formData.append('product_ids', String(id));
  }
  if (payload.image) {
    if (Platform.OS === 'web') {
      const blob = await (await fetch(payload.image.uri)).blob();
      formData.append('image', blob, payload.image.name);
    } else {
      // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
      formData.append('image', payload.image);
    }
  }
  return formData;
}

export async function createCollection(payload: CreateCollectionPayload): Promise<CollectionItem> {
  const formData = await buildCollectionFormData(payload);
  const { data } = await authenticatedClient.post<CollectionItem>('api/shop/collections/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateCollection(id: number, payload: UpdateCollectionPayload): Promise<CollectionItem> {
  const formData = await buildCollectionFormData(payload);
  const { data } = await authenticatedClient.patch<CollectionItem>(`api/shop/collections/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteCollection(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/collections/${id}/`);
}
