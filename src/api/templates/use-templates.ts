import type { AxiosError } from 'axios';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchBrowseTemplates, fetchTemplateCategories } from './client';
import type { BrowseTemplatesParams } from './types';

export const templateKeys = {
  all: ['templates'] as const,
  categories: () => [...templateKeys.all, 'categories'] as const,
  list: (params: Pick<BrowseTemplatesParams, 'category' | 'search'>) =>
    [...templateKeys.all, 'list', params] as const,
};

const PAGE_SIZE = 12;

export function useTemplateCategories() {
  return useQuery<Awaited<ReturnType<typeof fetchTemplateCategories>>, AxiosError>({
    queryKey: templateKeys.categories(),
    queryFn: fetchTemplateCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrowseTemplates(params: Pick<BrowseTemplatesParams, 'category' | 'search'>) {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchBrowseTemplates>>, AxiosError>({
    queryKey: templateKeys.list(params),
    queryFn: ({ pageParam }) =>
      fetchBrowseTemplates({ ...params, limit: PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.results.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });
}
