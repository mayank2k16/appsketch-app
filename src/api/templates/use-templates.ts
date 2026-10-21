import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import {
  buildSubdomain,
  cloneCodeTemplate,
  createTenantFromLayout,
  fetchBrowseTemplates,
  fetchCodeTemplates,
  fetchLayoutById,
  fetchTemplateCategories,
  publishTenantAppConfig,
} from './client';
import type {
  BrowseTemplatesParams,
  ClonedApp,
  MarketKind,
  MarketTemplate,
  UseTemplateInput,
  UseTemplateResult,
} from './types';

export const templateKeys = {
  all: ['templates'] as const,
  categories: () => [...templateKeys.all, 'categories'] as const,
  list: (params: Pick<BrowseTemplatesParams, 'category' | 'search'>) =>
    [...templateKeys.all, 'list', params] as const,
  market: (params: MarketParams) =>
    [...templateKeys.all, 'market', params] as const,
};

const PAGE_SIZE = 12;

export function useTemplateCategories() {
  return useQuery<
    Awaited<ReturnType<typeof fetchTemplateCategories>>,
    AxiosError
  >({
    queryKey: templateKeys.categories(),
    queryFn: fetchTemplateCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrowseTemplates(
  params: Pick<BrowseTemplatesParams, 'category' | 'search'>
) {
  return useInfiniteQuery<
    Awaited<ReturnType<typeof fetchBrowseTemplates>>,
    AxiosError
  >({
    queryKey: templateKeys.list(params),
    queryFn: ({ pageParam }) =>
      fetchBrowseTemplates({
        ...params,
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.results.length < PAGE_SIZE
        ? undefined
        : allPages.length * PAGE_SIZE,
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
      console.error(
        '[useUseTemplate] failed:',
        error.response?.status,
        error.response?.data ?? error.message
      );
    },
  });
}

type MarketParams = {
  kind: MarketKind;
  /** LayoutCategory id (layout sites) … */
  categoryId?: number | string;
  /** … and its name (code templates filter by name). */
  categoryName?: string;
  search?: string;
};

type MarketPage = {
  items: MarketTemplate[];
  /** Every match across both halves, once known. */
  count: number;
  next: { half: 'code' | 'layout'; offset: number } | undefined;
};

async function fetchMarketPage(
  params: MarketParams,
  { half, offset }: NonNullable<MarketPage['next']>
): Promise<MarketPage> {
  const { kind, categoryId, categoryName, search } = params;
  const withLayouts = kind === 'all' || kind === 'websites';
  const layoutParams = { category: categoryId, search };
  if (half === 'layout') {
    const page = await fetchBrowseTemplates({
      ...layoutParams,
      limit: PAGE_SIZE,
      offset,
    });
    return {
      items: page.results.map((t) => ({
        ...t,
        kind: 'layout' as const,
        key: `layout-${t.id}`,
      })),
      count: 0,
      next:
        page.results.length < PAGE_SIZE
          ? undefined
          : { half: 'layout', offset: offset + PAGE_SIZE },
    };
  }
  const appType =
    kind === 'apps' ? 'mobile' : kind === 'websites' ? 'web' : undefined;
  // The first page also learns how many layout sites follow, so the count is
  // right from the start.
  const [page, layoutHead] = await Promise.all([
    fetchCodeTemplates({
      category: categoryName,
      search,
      appType,
      ecosystem: kind === 'ecosystems',
      limit: PAGE_SIZE,
      offset,
    }),
    withLayouts && offset === 0
      ? fetchBrowseTemplates({ ...layoutParams, limit: 1, offset: 0 }).catch(
          () => null
        )
      : Promise.resolve(null),
  ]);
  const more =
    page.results.length > 0 && offset + page.results.length < page.count;
  const afterCode = withLayouts
    ? ({ half: 'layout', offset: 0 } as const)
    : undefined;
  return {
    items: page.results.map((t) => ({
      ...t,
      kind: 'code' as const,
      key: `code-${t.id}`,
    })),
    count: page.count + (layoutHead?.count ?? 0),
    next: more
      ? { half: 'code', offset: offset + page.results.length }
      : afterCode,
  };
}

/**
 * The `/templates` gallery on the phone: published apps (code templates, incl.
 * mobile apps and ecosystems) first, then the legacy layout sites — one
 * paginated list over both endpoints, filtered by the gallery's type switch.
 */
export function useMarketTemplates(params: MarketParams) {
  return useInfiniteQuery<MarketPage, AxiosError>({
    queryKey: templateKeys.market(params),
    initialPageParam: { half: 'code', offset: 0 },
    queryFn: ({ pageParam }) =>
      fetchMarketPage(params, pageParam as NonNullable<MarketPage['next']>),
    getNextPageParam: (lastPage) => lastPage.next,
    placeholderData: keepPreviousData,
  });
}

/** "Use app" on a code template: copy it into the caller's account. */
export function useCloneTemplate() {
  return useMutation<ClonedApp, AxiosError, number>({
    mutationFn: cloneCodeTemplate,
  });
}
