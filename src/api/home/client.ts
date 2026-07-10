/**
 * Home API client
 * Fetches home screen data. Uses mock responses when USE_MOCK_HOME_API is true
 * or when the real API fails (e.g. no backend).
 */

import { client } from '../common/client';
import {
  mockAnnouncement,
  mockCategories,
  mockMostPopular,
  mockNewItems,
  mockOrderCounts,
  mockRecentlyViewed,
  mockStories,
  mockUserProfile,
} from './mock-data';
import type {
  Announcement,
  Catalog,
  CategoriesApiResponse,
  CatalogApiResponse,
  Category,
  OrderStatusCounts,
  Product,
  RecentlyViewedItem,
  Story,
  UserProfile,
} from './types';

const USE_MOCK = false;

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchUserProfile(): Promise<UserProfile> {
  if (USE_MOCK) {
    return delay(300, mockUserProfile);
  }
  const { data } = await client.get<UserProfile>('/users/me/profile');
  return data;
}

export async function fetchAnnouncement(): Promise<Announcement | null> {
  if (USE_MOCK) {
    return delay(300, mockAnnouncement);
  }
  const { data } = await client.get<{ items: Announcement[] }>('/announcements?limit=1');
  return data.items?.[0] ?? null;
}

export async function fetchRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  if (USE_MOCK) {
    return delay(300, mockRecentlyViewed);
  }
  const { data } = await client.get<RecentlyViewedItem[]>('/users/me/recently-viewed');
  return data ?? [];
}

export async function fetchOrderCounts(): Promise<OrderStatusCounts> {
  if (USE_MOCK) {
    return delay(300, mockOrderCounts);
  }
  const { data } = await client.get<OrderStatusCounts>('/users/me/orders/counts');
  return data;
}

export async function fetchStories(): Promise<Story[]> {
  if (USE_MOCK) {
    return delay(300, mockStories);
  }
  const { data } = await client.get<Story[]>('/stories');
  return data ?? [];
}

export async function fetchNewItems(): Promise<Catalog[]> {
  if (USE_MOCK) {
    return delay(300, mockNewItems);
  }
  // const { data } = await client.get<{ CatalogApiResponse: Catalog[] }>(
  //   'api/shop/featured_categories/?tenant_id=8179'
  // );
  const response = await client.get<{
    data: {
      featured_categories: {
        name: string;
        currency: { code: string; symbol: string };
        products: any[];
      }[];
    };
  }>('api/shop/featured_categories/?tenant_id=9725');

  return response.data?.data?.featured_categories ?? [];

  // Flatten all products from all featured categories
  // const products = featured.flatMap((category) =>
  //   category.products.map((p) => ({
  //     id: String(p.id),
  //     imageUrl: p.image_url,
  //     title: p.name,
  //     price: parseFloat(p.price),
  //     originalPrice: parseFloat(p.mrp),
  //     a: category.name,
  //     likesCount: 0,
  //     statusTag: p.discount_percent > 0 ? 'Sale' : undefined,
  //   }))
  // );

  // return products;
}

export async function fetchMostPopular(): Promise<Product[]> {
  if (USE_MOCK) {
    return delay(300, mockMostPopular);
  }
  const { data } = await client.get<{ items: Product[] }>('/products/popular');
  return data.items ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  if (USE_MOCK) {
    return delay(300, mockCategories);
  }

  const { data } =
    await client.get<CategoriesApiResponse>('api/shop/category/');

  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchCatalog(): Promise<Catalog[]> {
  if (USE_MOCK) {
    return delay(300, mockCategories);
  }
  const { data } = await client.get<CatalogApiResponse>(
    'api/shop/featured_categories/?tenant_id=9725'
  );
  return Array.isArray(data?.data) ? data.data : [];
}
