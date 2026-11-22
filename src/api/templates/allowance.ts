import { accountClient } from '@/api/common/client';

/**
 * The plan's template allowance (backend builder/agent/coder/source_lock.py:
 * free 5, Basic 8, Growth 12, 100X 20; an ecosystem counts once). The clone
 * endpoint enforces it with a 402 `reason: template_limit`; these let the app
 * say so up front and free a slot by deleting one of the caller's copies.
 */
export type TemplateAllowance = {
  allowed: boolean;
  used: number;
  /** null = unlimited. */
  limit: number | null;
  tier: string;
  next_tier: string | null;
  next_limit: number | null;
  tier_limits?: Record<string, number | null>;
};

/** One of the caller's template copies that counts against the allowance. */
export type TemplateApp = {
  id: number;
  uuid: string | null;
  title: string;
  app_type: string;
  thumbnail_url: string;
  created_on: string;
  /** How many apps the copy is (an ecosystem is several). */
  apps: number;
};

export async function getTemplateAllowance(): Promise<TemplateAllowance> {
  const { data } = await accountClient.get<TemplateAllowance>(
    'builder/coder/template-allowance/'
  );
  return data;
}

export async function getTemplateApps(): Promise<{
  results: TemplateApp[];
  allowance: TemplateAllowance;
}> {
  const { data } = await accountClient.get('builder/coder/template-apps/');
  return data;
}

/** Soft-deletes the copy (an ecosystem: all its apps); returns the new allowance. */
export async function deleteTemplateApp(
  id: number
): Promise<{ removed: number; allowance: TemplateAllowance }> {
  const { data } = await accountClient.post(
    `builder/coder/template-apps/${id}/delete/`
  );
  return data;
}

export const tierLabel = (tier: string) =>
  !tier || tier === 'free' ? 'Free' : tier;
