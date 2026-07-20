import { accountClient } from '@/api/common/client';

import type { BrowseTemplatesParams, BrowseTemplatesResponse, TemplateCategory, TemplateListItem } from './types';

export async function fetchTemplateCategories(): Promise<TemplateCategory[]> {
  const { data } = await accountClient.get<{ data?: TemplateCategory[] } | TemplateCategory[]>(
    'builder/layouts/browse-categories/'
  );
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function fetchBrowseTemplates(params: BrowseTemplatesParams): Promise<BrowseTemplatesResponse> {
  const { category, search, limit = 12, offset = 0 } = params;
  const query: Record<string, string | number> = { limit, offset };
  if (category) query.category = category;
  if (search) query.search = search;

  const { data } = await accountClient.get<{ results?: TemplateListItem[]; count?: number } | TemplateListItem[]>(
    'builder/layouts/browse-portfolios/',
    { params: query }
  );
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  const results = data?.results ?? [];
  return { count: data?.count ?? results.length, next: null, previous: null, results };
}
