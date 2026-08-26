import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createNewsletterCampaign,
  fetchNewsletterCampaigns,
  fetchNewsletterSubscribers,
  sendNewsletterCampaign,
} from './client';
import type { CreateCampaignPayload, NewsletterListParams, NewsletterPage } from './types';

const PAGE_SIZE = 25;

export const newsletterKeys = {
  all: ['newsletter'] as const,
  subscribers: (params: Omit<NewsletterListParams, 'limit' | 'offset'>) =>
    [...newsletterKeys.all, 'subscribers', params] as const,
  campaigns: (params: Omit<NewsletterListParams, 'limit' | 'offset'>) =>
    [...newsletterKeys.all, 'campaigns', params] as const,
};

/** Both lists share the identical `{count, results} | T[]` envelope, so one
 * generic flattener covers both instead of two copy-pasted ones. */
export function flattenNewsletterPages<T>(pages: NewsletterPage<T>[] | undefined): T[] {
  return (pages ?? []).flatMap((p) => (Array.isArray(p) ? p : p.results));
}

/** The server-reported total (for the stat strip), not just how many rows
 * have loaded so far — falls back to the loaded count once the backend ever
 * returns a bare array (no `count` to read). */
export function totalNewsletterCount<T>(pages: NewsletterPage<T>[] | undefined): number {
  const last = pages?.[pages.length - 1];
  if (last && !Array.isArray(last)) return last.count;
  return flattenNewsletterPages(pages).length;
}

function useNewsletterPagedList<T>(
  queryKey: readonly unknown[],
  fetchPage: (params: NewsletterListParams) => Promise<NewsletterPage<T>>
) {
  return useInfiniteQuery<NewsletterPage<T>, AxiosError>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage({ limit: PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const pageResults = Array.isArray(lastPage) ? lastPage : lastPage.results;
      const loaded = allPages.reduce((sum, p) => sum + (Array.isArray(p) ? p.length : p.results.length), 0);
      const count = Array.isArray(lastPage) ? undefined : lastPage.count;
      if (count != null) return loaded < count ? loaded : undefined;
      return pageResults.length < PAGE_SIZE ? undefined : loaded;
    },
  });
}

export function useNewsletterSubscribers() {
  return useNewsletterPagedList(newsletterKeys.subscribers({}), fetchNewsletterSubscribers);
}

export function useNewsletterCampaigns() {
  return useNewsletterPagedList(newsletterKeys.campaigns({}), fetchNewsletterCampaigns);
}

export function useCreateNewsletterCampaign() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<{ message?: string }>, CreateCampaignPayload>({
    mutationFn: (payload) => createNewsletterCampaign(payload),
    onSuccess: () => {
      toast.success('Campaign drafted.');
      queryClient.invalidateQueries({ queryKey: newsletterKeys.all });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not create campaign.'),
  });
}

export function useSendNewsletterCampaign() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<{ message?: string }>, number>({
    mutationFn: (id) => sendNewsletterCampaign(id),
    onSuccess: () => {
      toast.success('Campaign queued for sending.');
      queryClient.invalidateQueries({ queryKey: newsletterKeys.all });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not queue campaign.'),
  });
}
