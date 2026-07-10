import { authenticatedClient } from '@/api/common/client';

import type {
  CartLineItem,
  CreateOrderPayload,
  Discount,
  InventoryOption,
  OrderDetail,
  OrderListItem,
  PreviewOrderPayload,
  PreviewOrderResponse,
  ProductSearchResult,
  TenantUserOption,
} from './types';

export async function fetchOrders(): Promise<OrderListItem[]> {
  const { data } = await authenticatedClient.get<OrderListItem[]>('api/shop/tenant/orders/');
  return data ?? [];
}

export async function fetchOrderDetailsById(orderId: number): Promise<OrderDetail> {
  const { data } = await authenticatedClient.get<{ data: OrderDetail }>(
    `api/dashboard/orders/${orderId}/`
  );
  return data.data;
}

export async function fetchOrderItemsDetailsById(orderId: number): Promise<CartLineItem[]> {
  const { data } = await authenticatedClient.get<{ message: CartLineItem[] }>(
    `api/shop/order/items/?id=${orderId}`
  );
  return data.message ?? [];
}

export async function createOrder(payload: CreateOrderPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/dashboard/orders/', payload);
  return data;
}

export async function updateOrder(payload: CreateOrderPayload): Promise<unknown> {
  const { data } = await authenticatedClient.patch('api/dashboard/orders/', payload);
  return data;
}

export async function deleteOrder(orderId: number): Promise<void> {
  await authenticatedClient.delete(`api/dashboard/orders/${orderId}/`);
}

export async function previewOrder(
  payload: PreviewOrderPayload
): Promise<PreviewOrderResponse> {
  const { data } = await authenticatedClient.post<PreviewOrderResponse>(
    'api/dashboard/orders/preview/',
    payload
  );
  return data;
}

export async function acceptOrder(orderId: number): Promise<void> {
  await authenticatedClient.post(`api/shop/confirm/order/${orderId}`);
}

export async function rejectOrder(orderId: number): Promise<void> {
  await authenticatedClient.post(`api/shop/reject/order/${orderId}`);
}

export async function fetchDiscounts(): Promise<Discount[]> {
  const { data } = await authenticatedClient.get<Discount[]>('api/shop/discounts/');
  return data ?? [];
}

export async function fetchInventories(): Promise<InventoryOption[]> {
  const { data } = await authenticatedClient.get<{ message: InventoryOption[] }>(
    'api/shop/inventories/'
  );
  return data.message ?? [];
}

export async function fetchTenantUsers(): Promise<TenantUserOption[]> {
  const { data } = await authenticatedClient.get<TenantUserOption[]>('api/account/tenant/users');
  return data ?? [];
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  if (!query.trim()) return [];
  const { data } = await authenticatedClient.get<{ results: ProductSearchResult[] }>(
    `api/shop/sellableproductsearch/${encodeURIComponent(query)}/`
  );
  return data.results ?? [];
}
