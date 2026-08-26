import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { moveWithinParent, updateCategoryById } from '@/containers/CMS/Categories/utils';
import { useStudio } from '@/lib/store/studio-store';
import { toast } from '@/lib/toast';

import {
  addSubCategory,
  createCategory,
  deleteCategoryAtAnyLevel,
  deleteProductFromCategory,
  fetchCategoryTree,
  fetchMarketplaceCategories,
  linkProductToCategory,
  reorderCategories,
  reorderCategoryProducts,
  updateCategory,
} from './client';
import type {
  AddSubCategoryPayload,
  CategoryNode,
  CreateCategoryPayload,
  DeleteCategoryAtAnyLevelPayload,
  LinkProductPayload,
  ReorderCategoriesPayload,
  ReorderCategoryProductsPayload,
  UnlinkProductPayload,
  UpdateCategoryPayload,
} from './types';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export function useCategoryTree() {
  const tenantType = useStudio.use.attachedTenant()?.tenant_type;
  const isMarketplace = tenantType === 'marketplace';
  return useQuery<Awaited<ReturnType<typeof fetchCategoryTree>>, AxiosError>({
    queryKey: categoryKeys.list(),
    queryFn: isMarketplace ? fetchMarketplaceCategories : fetchCategoryTree,
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

type ReorderContext = { previous?: CategoryNode[] };

/** Optimistic so the product disappears from an open `CategoryDetailSheet`
 * the instant you tap unlink, not after the invalidate→refetch round trip.
 * Pairs with `CategoriesScreen` deriving its selected category by id (via
 * `findCategoryById`) rather than holding a stale `CategoryNode` snapshot —
 * without that, this cache patch would land but the open sheet still
 * wouldn't see it. */
export function useDeleteProductFromCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, UnlinkProductPayload, ReorderContext>({
    mutationFn: (payload) => deleteProductFromCategory(payload),
    onMutate: async ({ category_id, id }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.list() });
      const previous = queryClient.getQueryData<CategoryNode[]>(categoryKeys.list());
      queryClient.setQueryData<CategoryNode[]>(categoryKeys.list(), (prev) =>
        prev
          ? updateCategoryById(prev, category_id, (cat) => ({
              ...cat,
              products: cat.products.filter((productId) => productId !== id),
            }))
          : prev
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Product removed from category successfully!');
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(categoryKeys.list(), context.previous);
      toast.error('Error in deleting product.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
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

/** Unlike the web CMS (which only rolls back by refetching on failure), this
 * applies the reorder to the cache immediately in `onMutate` so the dragged
 * row visually settles without waiting on a round trip, and restores the
 * pre-drag snapshot on failure. No success toast — a reorder that visibly
 * stuck needs no confirmation. */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, ReorderCategoriesPayload, ReorderContext>({
    mutationFn: ({ ids }) => reorderCategories(ids),
    onMutate: async ({ parentId, from, to }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.list() });
      const previous = queryClient.getQueryData<CategoryNode[]>(categoryKeys.list());
      queryClient.setQueryData<CategoryNode[]>(categoryKeys.list(), (prev) =>
        prev ? moveWithinParent(prev, parentId, { from, to }) : prev
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(categoryKeys.list(), context.previous);
      toast.error('Could not save the category order');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

/** Same optimistic/rollback shape as `useReorderCategories`, but rewrites a
 * single category's `products` array rather than a sibling group of nodes. */
export function useReorderCategoryProducts() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, ReorderCategoryProductsPayload, ReorderContext>({
    mutationFn: (payload) => reorderCategoryProducts(payload),
    onMutate: async ({ category_id, product_ids }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.list() });
      const previous = queryClient.getQueryData<CategoryNode[]>(categoryKeys.list());
      queryClient.setQueryData<CategoryNode[]>(categoryKeys.list(), (prev) =>
        prev ? updateCategoryById(prev, category_id, (cat) => ({ ...cat, products: product_ids })) : prev
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(categoryKeys.list(), context.previous);
      toast.error('Could not save the product order');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}
