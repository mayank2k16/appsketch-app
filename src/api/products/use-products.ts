import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createManufacturer,
  deleteProduct,
  fetchLeafCategories,
  fetchManufacturers,
  fetchProductInventories,
  fetchProducts,
  saveProduct,
} from './client';
import type { SaveProductInput } from './types';

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  inventories: () => [...productKeys.all, 'inventories'] as const,
  manufacturers: () => [...productKeys.all, 'manufacturers'] as const,
};

export function useProducts() {
  return useQuery<Awaited<ReturnType<typeof fetchProducts>>, AxiosError>({
    queryKey: productKeys.list(),
    queryFn: fetchProducts,
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
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
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
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
    onError: () => toast.error('Error deleting product.'),
  });
}
