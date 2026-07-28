import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';

import type { CreateStoryPayload, PickedStoryAsset, StoryFormFields, StoryItem, UpdateStoryPayload } from './types';

export async function fetchStories(): Promise<StoryItem[]> {
  const { data } = await authenticatedClient.get<{ results?: StoryItem[] } | StoryItem[]>('api/shop/cms/stories/');
  return Array.isArray(data) ? data : (data.results ?? []);
}

async function buildStoryFormData(payload: StoryFormFields & { image?: PickedStoryAsset }): Promise<FormData> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('subtitle', payload.subtitle);
  formData.append('timestamp_label', payload.timestamp_label);
  formData.append('body', payload.body);
  formData.append('cta_label', payload.cta_label);
  formData.append('action_link', payload.action_link);
  formData.append('priority', payload.priority === '' ? '0' : payload.priority);
  formData.append('is_featured', String(payload.is_featured));
  formData.append('is_active', String(payload.is_active));
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

export async function createStory(payload: CreateStoryPayload): Promise<StoryItem> {
  const formData = await buildStoryFormData(payload);
  const { data } = await authenticatedClient.post<StoryItem>('api/shop/cms/stories/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateStory(id: number, payload: UpdateStoryPayload): Promise<StoryItem> {
  const formData = await buildStoryFormData(payload);
  const { data } = await authenticatedClient.patch<StoryItem>(`api/shop/cms/stories/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteStory(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/cms/stories/${id}/`);
}
