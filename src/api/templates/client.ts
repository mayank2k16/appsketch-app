import { accountClient } from '@/api/common/client';

import type {
  BrowseTemplatesParams,
  BrowseTemplatesResponse,
  CreateTenantResponse,
  LayoutDetail,
  TemplateCategory,
  TemplateListItem,
} from './types';

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

export async function fetchLayoutById(id: number): Promise<LayoutDetail> {
  const { data } = await accountClient.get<LayoutDetail>(`builder/layouts/${id}/`);
  return data;
}

/** Unique-enough subdomain slug for a new tenant. The Vite reference this
 * flow is ported from hardcodes this to the literal string "Test35235" at
 * every call site, which would collide on every use — generate one instead. */
export function buildSubdomain(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 24);
  return `${base || 'app'}-${Date.now().toString(36)}`;
}

export async function createTenantFromLayout(params: {
  title: string;
  layoutId: number;
  subdomain: string;
  tenantCategory?: string;
}): Promise<CreateTenantResponse> {
  const { title, layoutId, subdomain, tenantCategory = '1' } = params;
  const form = new FormData();
  form.append('title', title);
  form.append('tenant_category', tenantCategory);
  form.append('subdomain', subdomain);
  form.append('layout_id', String(layoutId));

  // Native RN needs this header set explicitly for FormData bodies to be
  // sent as real multipart (same pattern as `uploadProductMedia`/`saveProduct`
  // in `api/products/client.ts`) — without it the request silently mis-sends
  // on device even though it works fine from a browser's XHR path.
  const { data } = await accountClient.post<CreateTenantResponse>('account/tenants/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Writes the template's config onto a newly created tenant. `is_app: true`
 * is required — the backend writes `Tenant.app_config` (what the app viewer
 * reads) only when this flag is set; otherwise it updates the website config. */
export async function publishTenantAppConfig(params: {
  tenantTemplateId: number;
  tenantId: number;
  tenantUuid: string;
  config: Record<string, unknown>;
}): Promise<void> {
  const { tenantTemplateId, tenantId, tenantUuid, config } = params;
  await accountClient.put(`account/tenant-templates/${tenantTemplateId}/update_config/`, {
    config,
    tenant_id: tenantId,
    tenant_uuid: tenantUuid,
    is_app: false,
  });
}
