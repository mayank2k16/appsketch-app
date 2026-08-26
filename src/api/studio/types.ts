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
  /** Already serialized by `TenantSerializer` (`account/serializers.py`) —
   * just wasn't typed here yet. Feeds the Studio search alongside `title`. */
  description?: string;
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
  /**
   * Not yet in `TenantSerializer.Meta.fields` (`account/serializers.py`) —
   * the model has it via `TimeStamped.created_on`, the serializer just
   * doesn't expose it under either name yet. Typed as optional so the
   * Studio card's "Created" row activates automatically once the backend
   * adds it, without another frontend deploy.
   */
  created_at?: string;
  created_on?: string;
};
