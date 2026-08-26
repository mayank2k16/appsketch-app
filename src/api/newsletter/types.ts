/**
 * Newsletter domain types — ported from Vite's `Containers/Cms/Newsletter` +
 * `Api/cmsAPI.js` (`Newsletter — admin/CMS endpoints` section) and confirmed
 * against the backend serializers directly (`newsletter/serializers.py`).
 * Tenant scoping is server-side (authenticated admin's tenant), no tenant
 * param needed from the client — same as Wallets.
 *
 * Subscribers are read-only from the CMS (opt in/out via public links) and
 * campaigns have no PATCH/DELETE route — draft + send are the only writes.
 */

export type NewsletterSubscriber = {
  id: number;
  email: string;
  is_confirmed: boolean;
  confirmed_on: string | null;
  is_unsubscribed: boolean;
  unsubscribed_on: string | null;
  created_on: string;
};

export type NewsletterCampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export type NewsletterCampaign = {
  id: number;
  subject: string;
  body_html: string;
  body_text: string;
  status: NewsletterCampaignStatus;
  sent_on: string | null;
  total_recipients: number;
  created_on: string;
};

export type NewsletterListParams = {
  limit?: number;
  offset?: number;
};

/** `LimitOffsetPagination`'s `{count, results}` — defended against a bare
 * array too, per the CMS API-layer convention (response shape isn't always
 * consistent across this backend). */
export type NewsletterPage<T> = { count: number; results: T[] } | T[];

export type CreateCampaignPayload = {
  subject: string;
  body_html: string;
  body_text: string;
};
