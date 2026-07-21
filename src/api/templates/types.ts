/**
 * AI Templates — ported from Vite's `Containers/AITemplates/AITemplates.jsx`
 * (the real `/aitemplates` browse page — not `HomeV4/Templates`, which is a
 * different component, the home-page marquee teaser that just links out to
 * this page). Account-level, not tenant-scoped — browsing templates isn't
 * tied to a specific store.
 */

export type TemplateCategory = {
  id: number | string;
  name: string;
  description?: string;
  layout_count?: number;
};

export type TemplateListItem = {
  id: number;
  name: string;
  description?: string;
  thumbnail_image?: string;
  likes?: number;
  views?: number;
  tags?: string[];
};

export type BrowseTemplatesParams = {
  category?: number | string | null;
  search?: string;
  limit?: number;
  offset?: number;
};

export type BrowseTemplatesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateListItem[];
};

/** Full layout detail — browse rows are lean and don't carry `config`, so
 * "Use this template" fetches this on demand before publishing it. */
export type LayoutDetail = {
  id: number;
  config: Record<string, unknown>;
  [key: string]: unknown;
};

/** Response shape from `POST account/tenants/` (only the fields we use). */
export type CreateTenantResponse = {
  id: number;
  uuid: string;
  template_configs: { id: number }[];
  [key: string]: unknown;
};

export type UseTemplateResult = {
  uuid: string;
  name: string;
};

/** Only what the create-tenant-from-template flow actually needs — lets it
 * be kicked off from just route params (id + name) as well as a full
 * `TemplateListItem`, since the two live on different screens. */
export type UseTemplateInput = {
  id: number;
  name: string;
};
