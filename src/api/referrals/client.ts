import { authenticatedClient } from '@/api/common/client';

import type {
  ReferralAnalytics,
  ReferralLinkConfig,
  ReferralListItem,
  ReferralRule,
  ReferralRulePayload,
  ReferralsListParams,
  ReferralsListResponse,
  UpdateReferralLinkConfigPayload,
} from './types';

// The rules-list endpoint is inconsistently shaped in Vite's own backend
// contract (raw array, `{results:[...]}`, or `{data:[...]}` depending on
// pagination state) — porting the same defensive triple-fallback Vite's
// `ReferralRules.jsx`'s `load()` uses instead of assuming one shape.
export async function fetchReferralRules(): Promise<ReferralRule[]> {
  const { data } = await authenticatedClient.get<
    ReferralRule[] | { results?: ReferralRule[]; data?: ReferralRule[] }
  >('api/referrals/admin/rules/');
  if (Array.isArray(data)) return data;
  return data.results ?? data.data ?? [];
}

export async function createReferralRule(payload: ReferralRulePayload): Promise<ReferralRule> {
  const { data } = await authenticatedClient.post<ReferralRule>('api/referrals/admin/rules/', payload);
  return data;
}

export async function updateReferralRule(id: number, payload: Partial<ReferralRulePayload>): Promise<ReferralRule> {
  const { data } = await authenticatedClient.patch<ReferralRule>(`api/referrals/admin/rules/${id}/`, payload);
  return data;
}

export async function deleteReferralRule(id: number): Promise<void> {
  await authenticatedClient.delete(`api/referrals/admin/rules/${id}/`);
}

export async function fetchReferralsList(params: ReferralsListParams): Promise<ReferralsListResponse> {
  const { status, ...rest } = params;
  const { data } = await authenticatedClient.get<{ data: ReferralListItem[]; next_cursor: string | number | null }>(
    'api/referrals/admin/list/',
    { params: { ...rest, ...(status && status !== 'ALL' ? { status } : {}) } }
  );
  return { data: data.data ?? [], next_cursor: data.next_cursor ?? null };
}

export async function fetchReferralsAnalytics(): Promise<ReferralAnalytics | null> {
  const { data } = await authenticatedClient.get<{ data: ReferralAnalytics | null }>('api/referrals/admin/analytics/');
  return data.data ?? null;
}

export async function fetchReferralLinkConfig(): Promise<ReferralLinkConfig | null> {
  const { data } = await authenticatedClient.get<{ data: ReferralLinkConfig | null }>('api/referrals/admin/link-config/');
  return data.data ?? null;
}

export async function updateReferralLinkConfig(payload: UpdateReferralLinkConfigPayload): Promise<ReferralLinkConfig> {
  const { data } = await authenticatedClient.patch<{ data: ReferralLinkConfig }>('api/referrals/admin/link-config/', payload);
  return data.data;
}
