import { useRouter } from 'expo-router';
import * as React from 'react';

import { type MarketTemplate, useCloneTemplate } from '@/api/templates';
import { endEta, startEta } from '@/components/eta';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

/**
 * "Use this template" / the Market's "Use app": signed-out users go to
 * /login; otherwise the template is cloned into their account (an ecosystem
 * copies every app) under the ETA loader, and the builder opens on the
 * copy's preview. Code templates only — the Market offers no "use" on a
 * legacy layout site (its Preview creates one).
 *
 * A 401 while the app believes it is signed in is not "sign in again": the
 * session is there (Apple accounts included); the copy failed. It says so
 * instead of bouncing a signed-in user to the login screen.
 */
export function useCloneAndOpen() {
  const router = useRouter();
  const clone = useCloneTemplate();
  const [usingKey, setUsingKey] = React.useState<string | null>(null);

  const use = React.useCallback(
    (template: MarketTemplate) => {
      if (template.kind !== 'code' || usingKey) return;
      if (useAuth.getState().status !== 'signIn') {
        toast.info('Sign in to use this template.');
        router.push('/login');
        return;
      }
      setUsingKey(template.key);
      const eta = startEta('clone', 'Copying the template');
      clone.mutate(template.id, {
        onSuccess: (app) => {
          endEta(eta, true);
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
          endEta(eta, false);
          const data = error.response?.data as { error?: string } | undefined;
          toast.error(
            error.response?.status === 401
              ? "Couldn't copy this template to your account. Please try again."
              : (data?.error ?? 'Could not copy this template.')
          );
        },
        onSettled: () => setUsingKey(null),
      });
    },
    [usingKey, clone, router]
  );

  return { use, usingKey };
}

/** The template page's "Use this template", for one template. */
export function useUseTemplate(template: MarketTemplate) {
  const { use, usingKey } = useCloneAndOpen();
  const run = React.useCallback(() => use(template), [use, template]);
  return {
    use: run,
    busy: usingKey === template.key,
    available: template.kind === 'code',
  };
}
