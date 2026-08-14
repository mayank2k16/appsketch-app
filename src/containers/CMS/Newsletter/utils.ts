import type { NewsletterCampaignStatus } from '@/api/newsletter';

import type { CmsStatusMeta } from '../components';

export function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getSubscriberStatusMeta(subscriber: {
  is_confirmed: boolean;
  is_unsubscribed: boolean;
}): CmsStatusMeta {
  if (subscriber.is_unsubscribed) return { label: 'Unsubscribed', color: '#94A3B8', kind: 'info' };
  if (subscriber.is_confirmed) return { label: 'Confirmed', color: '#4CAF50', kind: 'success' };
  return { label: 'Pending', color: '#FF9800', kind: 'warning' };
}

const CAMPAIGN_STATUS_META: Record<NewsletterCampaignStatus, CmsStatusMeta> = {
  draft: { label: 'Draft', color: '#94A3B8', kind: 'info' },
  sending: { label: 'Sending', color: '#FF9800', kind: 'warning' },
  sent: { label: 'Sent', color: '#4CAF50', kind: 'success' },
  failed: { label: 'Failed', color: '#F44336', kind: 'danger' },
};

export function getCampaignStatusMeta(status: NewsletterCampaignStatus | string): CmsStatusMeta {
  return CAMPAIGN_STATUS_META[status as NewsletterCampaignStatus] ?? { label: status, color: '#94A3B8', kind: 'info' };
}
