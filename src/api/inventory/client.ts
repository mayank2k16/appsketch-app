import { authenticatedClient } from '@/api/common/client';

import type { InventoryLocation, InventoryLocationPayload } from './types';

export async function fetchInventoryLocations(): Promise<InventoryLocation[]> {
  const { data } = await authenticatedClient.get<{ results: InventoryLocation[] }>(
    'api/dashboard/inventory/'
  );
  return data.results ?? [];
}

export async function createInventoryLocation(
  payload: InventoryLocationPayload
): Promise<InventoryLocation> {
  const { data } = await authenticatedClient.post<InventoryLocation>(
    'api/dashboard/inventory/',
    payload
  );
  return data;
}

export async function updateInventoryLocation(
  id: number,
  payload: InventoryLocationPayload
): Promise<InventoryLocation> {
  const { data } = await authenticatedClient.put<InventoryLocation>(
    `api/dashboard/inventory/${id}/`,
    payload
  );
  return data;
}
