import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useStudio } from '@/lib/store/studio-store';
import { toast } from '@/lib/toast';

import {
  createManufacturer,
  deleteProduct,
  fetchLeafCategories,
  fetchManufacturers,
  fetchMarketplaceProducts,
  fetchProductInventories,
  fetchProductReviewHistory,
  fetchProducts,
  resubmitProduct,
  saveProduct,
} from './client';
import type { ProductListItem, SaveProductInput } from './types';

export const productKeys = {
  all: ['products'] as const,
  list: (tenantType: string | null | undefined) => [...productKeys.all, 'list', tenantType ?? null] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  inventories: () => [...productKeys.all, 'inventories'] as const,
  manufacturers: () => [...productKeys.all, 'manufacturers'] as const,
  reviewHistory: (productId: number) => [...productKeys.all, 'reviewHistory', productId] as const,
};

/** Marketplace tenants read from a different endpoint entirely (one row per
 * vendor with its own product list, vs. this tenant's own flat list) —
 * that's the only way `sold_by_name`/`tenant_name` ever show up on a row,
 * matching Vite's own `fetchAllProducts` saga branch. */
export function useProducts() {
  const tenantType = useStudio.use.attachedTenant()?.tenant_type;
  const isMarketplace = tenantType === 'marketplace';
  return useQuery<ProductListItem[], AxiosError>({
    queryKey: productKeys.list(tenantType),
    queryFn: isMarketplace ? fetchMarketplaceProducts : fetchProducts,
  });
}

export function useProductReviewHistory(productId: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchProductReviewHistory>>, AxiosError>({
    queryKey: productKeys.reviewHistory(productId ?? -1),
    queryFn: () => fetchProductReviewHistory(productId as number),
    enabled: productId != null,
  });
}

export function useLeafCategories() {
  return useQuery<Awaited<ReturnType<typeof fetchLeafCategories>>, AxiosError>({
    queryKey: productKeys.categories(),
    queryFn: fetchLeafCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductInventories() {
  return useQuery<Awaited<ReturnType<typeof fetchProductInventories>>, AxiosError>({
    queryKey: productKeys.inventories(),
    queryFn: fetchProductInventories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useManufacturers() {
  return useQuery<Awaited<ReturnType<typeof fetchManufacturers>>, AxiosError>({
    queryKey: productKeys.manufacturers(),
    queryFn: fetchManufacturers,
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createManufacturer(name),
    onSuccess: () => {
      toast.success('Manufacturer added successfully!');
      queryClient.invalidateQueries({ queryKey: productKeys.manufacturers() });
    },
    onError: () => toast.error('Failed to add manufacturer. Please try again.'),
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveProductInput) => saveProduct(input),
    onSuccess: () => {
      toast.success('Product saved successfully.');
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: () => toast.error('Error saving product.'),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: () => toast.error('Error deleting product.'),
  });
}

export function useResubmitProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resubmitProduct(id),
    onSuccess: () => {
      toast.success('Product resubmitted for approval');
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: () => toast.error('Error resubmitting product.'),
  });
}
