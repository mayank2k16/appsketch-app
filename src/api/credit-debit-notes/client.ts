import { authenticatedClient } from '@/api/common/client';

import type { CreateNotePayload, NoteListItem, SellableInstance } from './types';

export async function fetchNotes(): Promise<NoteListItem[]> {
  const { data } = await authenticatedClient.get<
    { results?: NoteListItem[]; data?: NoteListItem[] } | NoteListItem[]
  >('api/shop/notes/');
  return Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
}

export async function createNote(payload: CreateNotePayload): Promise<{ msg?: string }> {
  const { data } = await authenticatedClient.post<{ msg?: string }>('api/shop/notes/', payload);
  return data;
}

export async function fetchSellableInstances(params: {
  entityId: number;
  productId: number;
  inventoryId: number;
}): Promise<SellableInstance[]> {
  const { data } = await authenticatedClient.get<SellableInstance[]>('api/shop/get_sellable_instances', {
    params: { entity_id: params.entityId, product_id: params.productId, inventory_id: params.inventoryId },
  });
  return data ?? [];
}
