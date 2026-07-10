/**
 * React Query hooks for home screen API
 * Uses react-query-kit pattern where applicable; standard useQuery for simplicity
 */

import type { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import type {
  UserProfile,
  Announcement,
  RecentlyViewedItem,
  OrderStatusCounts,
  Story,
  Product,
  Category,
  Catalog
} from './types';
import {
  fetchUserProfile,
  fetchAnnouncement,
  fetchRecentlyViewed,
  fetchOrderCounts,
  fetchStories,
  fetchNewItems,
  fetchMostPopular,
  fetchCategories,
  fetchCatalog,
} from './client';

export const homeKeys = {
  all: ['home'] as const,
  user: () => [...homeKeys.all, 'user'] as const,
  announcement: () => [...homeKeys.all, 'announcement'] as const,
  recentlyViewed: () => [...homeKeys.all, 'recently-viewed'] as const,
  orderCounts: () => [...homeKeys.all, 'order-counts'] as const,
  stories: () => [...homeKeys.all, 'stories'] as const,
  newItems: () => [...homeKeys.all, 'new-items'] as const,
  mostPopular: () => [...homeKeys.all, 'most-popular'] as const,
  categories: () => [...homeKeys.all, 'categories'] as const,
  catalog: () => [...homeKeys.all, 'catalog'] as const,
};

export function useUserProfile() {
  return useQuery<UserProfile, AxiosError>({
    queryKey: homeKeys.user(),
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnnouncement() {
  return useQuery<Announcement | null, AxiosError>({
    queryKey: homeKeys.announcement(),
    queryFn: fetchAnnouncement,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecentlyViewed() {
  return useQuery<RecentlyViewedItem[], AxiosError>({
    queryKey: homeKeys.recentlyViewed(),
    queryFn: fetchRecentlyViewed,
    staleTime: 1 * 60 * 1000,
  });
}

export function useOrderCounts() {
  return useQuery<OrderStatusCounts, AxiosError>({
    queryKey: homeKeys.orderCounts(),
    queryFn: fetchOrderCounts,
    staleTime: 1 * 60 * 1000,
  });
}

export function useStories() {
  return useQuery<Story[], AxiosError>({
    queryKey: homeKeys.stories(),
    queryFn: fetchStories,
    staleTime: 2 * 60 * 1000,
  });
}

export function useNewItems() {
  return useQuery<Product[], AxiosError>({
    queryKey: homeKeys.newItems(),
    queryFn: fetchNewItems,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMostPopular() {
  return useQuery<Product[], AxiosError>({
    queryKey: homeKeys.mostPopular(),
    queryFn: fetchMostPopular,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery<Category[], AxiosError>({
    queryKey: homeKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCatalog() {
  return useQuery<Catalog[], AxiosError>({
    queryKey: homeKeys.catalog(),
    queryFn: fetchCatalog,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Combined hook for home screen. Fetches all sections in parallel.
 */
export function useHomePage() {
  const user = useUserProfile();
  const announcement = useAnnouncement();
  const recentlyViewed = useRecentlyViewed();
  const orderCounts = useOrderCounts();
  const stories = useStories();
  const newItems = useNewItems();
  const mostPopular = useMostPopular();
  const categories = useCategories();
  const catalog = useCatalog();

  const isLoading =
    user.isLoading ||
    announcement.isLoading ||
    recentlyViewed.isLoading ||
    orderCounts.isLoading ||
    stories.isLoading ||
    newItems.isLoading ||
    mostPopular.isLoading ||
    categories.isLoading ||
    catalog.isLoading;

  const isError =
    user.isError ||
    announcement.isError ||
    recentlyViewed.isError ||
    orderCounts.isError ||
    stories.isError ||
    newItems.isError ||
    mostPopular.isError ||
    categories.isError ||
    catalog.isError;

  return {
    user,
    announcement,
    recentlyViewed,
    orderCounts,
    stories,
    newItems,
    mostPopular,
    categories,
    catalog,
    isLoading,
    isError,
  };
}
