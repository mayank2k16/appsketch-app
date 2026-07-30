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
  uuid?: string;
  title: string;
  website_url?: string;
  logo?: string;
  template_configs?: TenantTemplateConfig[];
  /**
   * Gates which CMS tabs render — mirrors the Vite reference's
   * `?type=` query param (`SideBar.jsx`/`TenantDashboard.jsx`). Known values
   * seen so far: `"marketplace"`, `"appointment"`. Plain e-commerce tenants
   * omit it or send some other/empty value — treat anything unrecognized as
   * the default e-commerce case, don't assume it's one of the known ones.
   */
  tenant_type?: string;
};
