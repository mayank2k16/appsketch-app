/**
 * Studio domain types — the account-level "my stores" list and the
 * attach-tenant action that hands a store off to its CMS. Mirrors the Vite
 * reference's `GET /account/tenants/` response shape (fields actually
 * consumed there — the endpoint may return more).
 */

export type TenantTemplateConfig = {
  id: number | string;
  config?: Record<string, unknown>;
};

export type TenantSummary = {
  id: number | string;
  title: string;
  website_url?: string;
  logo?: string;
  template_configs?: TenantTemplateConfig[];
};
