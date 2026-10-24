import { accountClient } from '@/api/common/client';

import type { DomainSearchResponse, DomainView } from './types';

const BASE = 'account/app-domains/';

/** appsketch.ai answers unknown /api paths with its HTML shell (200), so a
 *  body without the expected shape is an error, never "no results". */
function expect<T>(ok: boolean, data: T): T {
  if (!ok) throw new Error('Unexpected response from the server');
  return data;
}

const isDomain = (d: unknown): d is DomainView =>
  !!d && typeof d === 'object' && typeof (d as DomainView).domain === 'string';

export async function searchDomains(
  q: string,
  currency?: string
): Promise<DomainSearchResponse> {
  const { data } = await accountClient.get<DomainSearchResponse>(
    `${BASE}search/`,
    { params: { q, currency } }
  );
  return expect(Array.isArray(data?.results), data);
}

export async function fetchMyDomains(): Promise<DomainView[]> {
  const { data } = await accountClient.get<{ domains: DomainView[] }>(BASE);
  return expect(Array.isArray(data?.domains), data).domains;
}

export async function fetchDomain(id: number | string): Promise<DomainView> {
  const { data } = await accountClient.get<DomainView>(`${BASE}${id}/`);
  return expect(isDomain(data), data);
}

export async function connectDomain(body: {
  tenant_id: number | string;
  domain: string;
}): Promise<DomainView> {
  const { data } = await accountClient.post<DomainView>(
    `${BASE}connect/`,
    body
  );
  return expect(isDomain(data), data);
}

export async function attachDomain(body: {
  id: number;
  tenant_id: number | string;
}): Promise<DomainView> {
  const { data } = await accountClient.post<DomainView>(
    `${BASE}${body.id}/attach/`,
    { tenant_id: body.tenant_id }
  );
  return expect(isDomain(data), data);
}

export async function retryDomain(id: number): Promise<DomainView> {
  const { data } = await accountClient.post<DomainView>(`${BASE}${id}/retry/`);
  return expect(isDomain(data), data);
}

export async function disconnectDomain(id: number): Promise<void> {
  await accountClient.delete(`${BASE}${id}/`);
}
