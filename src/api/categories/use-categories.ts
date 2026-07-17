import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  addSubCategory,
  createCategory,
  deleteCategoryAtAnyLevel,
  deleteProductFromCategory,
  fetchCategoryTree,
  linkProductToCategory,
  updateCategory,
} from './client';
import type {
  AddSubCategoryPayload,
  CreateCategoryPayload,
  DeleteCategoryAtAnyLevelPayload,
  LinkProductPayload,
  UnlinkProductPayload,
  UpdateCategoryPayload,
} from './types';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export function useCategoryTree() {
  return useQuery<Awaited<ReturnType<typeof fetchCategoryTree>>, AxiosError>({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategoryTree,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreateCategoryPayload>({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
      toast.success('Category added successfully.');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: () => toast.error('Error while saving category'),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, UpdateCategoryPayload>({
    mutationFn: (payload) => updateCategory(payload),
    onSuccess: () => {
      toast.success('Category updated successfully.');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: () => toast.error('Error while saving category'),
  });
}

export function useAddSubCategory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, AddSubCategoryPayload>({
    mutationFn: (payload) => addSubCategory(payload),
    onSuccess: () => {
      toast.success('Added subcategory successfully');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: () => toast.error('Error while adding sub category'),
  });
}

export function useDeleteCategoryAtAnyLevel() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, DeleteCategoryAtAnyLevelPayload>({
    mutationFn: (payload) => deleteCategoryAtAnyLevel(payload),
    onSuccess: (_data, payload) => {
      toast.success(payload.parent ? 'Subcategory deleted successfully!' : 'Category deleted successfully!');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: (_err, payload) =>
      toast.error(payload.parent ? 'Error in deleting subcategory.' : 'Error in deleting category.'),
  });
}

export function useDeleteProductFromCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, UnlinkProductPayload>({
    mutationFn: (payload) => deleteProductFromCategory(payload),
    onSuccess: () => {
      toast.success('Product removed from category successfully!');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: () => toast.error('Error in deleting product.'),
  });
}

export function useLinkProductToCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, LinkProductPayload>({
    mutationFn: (payload) => linkProductToCategory(payload),
    onSuccess: () => {
      toast.success('Linked successfully');
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
    onError: () => toast.error('Error while linking product'),
  });
}
