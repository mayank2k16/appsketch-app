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
