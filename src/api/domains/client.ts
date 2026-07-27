import { accountClient } from '@/api/common/client';

import type {
  DomainSearchResponse,
  DomainSearchResult,
  PurchaseDomainPayload,
  UserDomain,
  UserDomainsResponse,
} from './types';

export async function searchDomains(query: string): Promise<DomainSearchResult[]> {
  const { data } = await accountClient.get<DomainSearchResponse>('account/domains/get-available-domains/', {
    params: { domain: query },
  });
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function purchaseDomain(payload: PurchaseDomainPayload): Promise<unknown> {
  const { data } = await accountClient.post('account/domains/purchase-domain/', payload);
  return data;
}

export async function fetchUserDomains(): Promise<UserDomain[]> {
  const { data } = await accountClient.get<UserDomainsResponse>('account/custom-domains/');
  return Array.isArray(data) ? data : (data.results ?? []);
}
