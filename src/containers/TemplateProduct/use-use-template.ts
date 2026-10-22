import { useRouter } from 'expo-router';
import * as React from 'react';

import { type MarketTemplate, useCloneTemplate } from '@/api/templates';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

/**
 * "Use this template", wired exactly as the Market's "Use app"
 * (MarketplaceScreen.handleUse): signed-out users go to /login; otherwise
 * the template is cloned into their account (an ecosystem copies every app)
 * and the builder opens on the copy's preview. Code templates only — the
 * Market offers no "use" on a legacy layout site (its Preview creates one).
 */
export function useUseTemplate(template: MarketTemplate) {
  const router = useRouter();
  const clone = useCloneTemplate();
  const [busy, setBusy] = React.useState(false);

  const use = React.useCallback(() => {
    if (template.kind !== 'code' || busy) return;
    if (useAuth.getState().status !== 'signIn') {
      toast.info('Sign in to use this template.');
      router.push('/login');
      return;
    }
    setBusy(true);
    clone.mutate(template.id, {
      onSuccess: (app) => {
        router.push({
          pathname: '/code-editor/preview',
          params: {
            tenantId: String(app.id),
            tenantUid: app.uuid,
            appType: app.app_type ?? template.app_type,
          },
        } as never);
      },
      onError: (error) => {
        if (error.response?.status === 401) {
          toast.info('Sign in to use this template.');
          router.push('/login');
          return;
        }
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error ?? 'Could not copy this template.');
      },
      onSettled: () => setBusy(false),
    });
  }, [template, busy, clone, router]);

  return { use, busy, available: template.kind === 'code' };
}
