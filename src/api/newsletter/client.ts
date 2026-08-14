import { authenticatedClient } from '@/api/common/client';

import type {
  CreateCampaignPayload,
  NewsletterCampaign,
  NewsletterListParams,
  NewsletterPage,
  NewsletterSubscriber,
} from './types';

export async function fetchNewsletterSubscribers(
  params: NewsletterListParams
): Promise<NewsletterPage<NewsletterSubscriber>> {
  const { data } = await authenticatedClient.get<NewsletterPage<NewsletterSubscriber>>(
    'api/newsletter/subscribers/',
    { params }
  );
  return data;
}

export async function fetchNewsletterCampaigns(
  params: NewsletterListParams
): Promise<NewsletterPage<NewsletterCampaign>> {
  const { data } = await authenticatedClient.get<NewsletterPage<NewsletterCampaign>>(
    'api/newsletter/campaigns/',
    { params }
  );
  return data;
}

export async function createNewsletterCampaign(payload: CreateCampaignPayload): Promise<NewsletterCampaign> {
  const { data } = await authenticatedClient.post<NewsletterCampaign>('api/newsletter/campaigns/', payload);
  return data;
}

export async function sendNewsletterCampaign(id: number): Promise<void> {
  await authenticatedClient.post(`api/newsletter/campaigns/${id}/send/`, {});
}
