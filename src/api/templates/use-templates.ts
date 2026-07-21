import type { AxiosError } from 'axios';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import {
  buildSubdomain,
  createTenantFromLayout,
  fetchBrowseTemplates,
  fetchLayoutById,
  fetchTemplateCategories,
  publishTenantAppConfig,
} from './client';
import type { BrowseTemplatesParams, UseTemplateInput, UseTemplateResult } from './types';

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
    // Keep the previous category/search results on screen while the next
    // filter's page loads — without this, switching categories drops `data`
    // immediately and flips `isLoading` back to true, which was forcing the
    // whole grid to unmount into the skeleton state on every tap.
    placeholderData: keepPreviousData,
  });
}

/** "Use this template" — creates a tenant from the template's layout and
 * publishes the layout's config onto it as the tenant's app config, then
 * resolves the new tenant's uuid for the live app preview. Kicked off from
 * `AppPreviewScreen` itself (not the template grid) so navigating there is
 * instant and this ~4-7s chain runs in the background against that screen. */
export function useUseTemplate() {
  return useMutation<UseTemplateResult, AxiosError, UseTemplateInput>({
    mutationFn: async (template) => {
      const layout = await fetchLayoutById(template.id);
      const tenant = await createTenantFromLayout({
        title: template.name || 'Untitled',
        layoutId: template.id,
        subdomain: buildSubdomain(template.name || 'app'),
      });
      const tenantTemplateId = tenant.template_configs?.[0]?.id;
      if (tenantTemplateId) {
        await publishTenantAppConfig({
          tenantTemplateId,
          tenantId: tenant.id,
          tenantUuid: tenant.uuid,
          config: layout.config,
        });
      }
      return { uuid: tenant.uuid, name: template.name };
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('[useUseTemplate] failed:', error.response?.status, error.response?.data ?? error.message);
    },
  });
}
