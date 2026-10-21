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

/** A published app (`render_engine="code"`): a whole tenant, offered as a
 * template by `GET builder/coder/templates/`. Using one CLONES the tenant —
 * files, data and builder chat; for an ecosystem, every app in its group. */
export type CodeTemplate = {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  category?: string | null;
  app_type: 'web' | 'mobile';
  /** Live site of a web app; empty for a mobile app. */
  preview_url?: string;
  ecosystem?: {
    id?: number;
    name?: string;
    /** Every app in the group: rider app, driver app, website + admin… */
    apps?: {
      id: number;
      title: string;
      app_type?: string;
      label?: string;
      is_home?: boolean;
    }[];
  } | null;
  /** Runs this mobile app on the phone (backend native export); null until
   * it has one. Older backends leave it out. */
  native_manifest_url?: string | null;
  /** Newest Android build, if any. */
  apk_url?: string | null;
  tags?: string[];
  featured?: boolean;
};

export type CodeTemplatesResponse = { count: number; results: CodeTemplate[] };

/** `POST builder/coder/clone/` — the caller's new copy. */
export type ClonedApp = {
  id: number;
  uuid: string;
  title: string;
  app_type: 'web' | 'mobile';
};

/** The Market's type filter, as on the web gallery. */
export type MarketKind = 'all' | 'apps' | 'websites' | 'ecosystems';

/** One card in the Market: a code template or a legacy layout site. */
export type MarketTemplate =
  | ({ kind: 'code'; key: string } & CodeTemplate)
  | ({ kind: 'layout'; key: string } & TemplateListItem);
