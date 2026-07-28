import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type {
  CreateShortVideoPayload,
  PickedShortVideoAsset,
  ShortVideoFormFields,
  ShortVideoItem,
  UpdateShortVideoPayload,
} from './types';

export async function fetchShortVideos(): Promise<ShortVideoItem[]> {
  const { data } = await authenticatedClient.get<{ results?: ShortVideoItem[] } | ShortVideoItem[]>(
    'api/shop/cms/short-videos/'
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

async function appendAsset(formData: FormData, key: 'image' | 'video', asset: PickedShortVideoAsset) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    formData.append(key, blob, asset.name);
  } else {
    // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
    formData.append(key, asset);
  }
}

async function buildShortVideoFormData(
  payload: ShortVideoFormFields & { image?: PickedShortVideoAsset; video?: PickedShortVideoAsset }
): Promise<FormData> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  // "" clears the bound server-side — mirrors Vite's ShortVideoSerializer.to_internal_value.
  formData.append('start_at', payload.start_at);
  formData.append('end_at', payload.end_at);
  formData.append('priority', payload.priority === '' ? '0' : payload.priority);
  formData.append('is_active', String(payload.is_active));
  if (payload.image) await appendAsset(formData, 'image', payload.image);
  if (payload.video) await appendAsset(formData, 'video', payload.video);
  return formData;
}

export async function createShortVideo(payload: CreateShortVideoPayload): Promise<ShortVideoItem> {
  const formData = await buildShortVideoFormData(payload);
  const { data } = await authenticatedClient.post<ShortVideoItem>('api/shop/cms/short-videos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateShortVideo(id: number, payload: UpdateShortVideoPayload): Promise<ShortVideoItem> {
  const formData = await buildShortVideoFormData(payload);
  const { data } = await authenticatedClient.patch<ShortVideoItem>(`api/shop/cms/short-videos/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteShortVideo(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/cms/short-videos/${id}/`);
}
