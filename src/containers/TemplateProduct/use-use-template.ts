import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  type MarketTemplate,
  type TemplateAllowance,
  useCloneTemplate,
} from '@/api/templates';
import { endEta, startEta } from '@/components/eta';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

import { useShowLimit } from './template-slot';

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
/** A first message for the builder's agent on the copy, with images
 *  (local URIs; the chat uploads them). */
export type CopyBrief = { prompt: string; images: string[] };

/** What a copy needs: the code template's id (and key, for busy state). */
export type CloneTarget = { id: number; key: string; app_type?: string };

/** Why a copy failed, said once. The plan's template allowance used up
 *  (402 template_limit) opens the limit sheet instead: upgrade or delete an
 *  app, then `retry` runs this same copy again. A 401 while the app believes
 *  it is signed in is not "sign in again" (see above). */
function cloneFailed(
  error: AxiosError,
  retry: () => void,
  showLimit: (a: TemplateAllowance, retry: () => void) => void
) {
  const data = error.response?.data as
    | ({ error?: string; reason?: string } & TemplateAllowance)
    | undefined;
  if (error.response?.status === 402 && data?.reason === 'template_limit') {
    showLimit(data, retry);
    return;
  }
  toast.error(
    error.response?.status === 401
      ? "Couldn't copy this template to your account. Please try again."
      : (data?.error ?? 'Could not copy this template.')
  );
}

export function useCloneAndOpen({
  replace = false,
  open = 'preview',
}: {
  replace?: boolean;
  /** Where the copy opens: its preview, or the builder's AI chat
   *  ("Customise with AI"). */
  open?: 'preview' | 'chat';
} = {}) {
  const router = useRouter();
  const clone = useCloneTemplate();
  const showLimit = useShowLimit();
  const [usingKey, setUsingKey] = React.useState<string | null>(null);

  const copy = React.useCallback(
    (template: CloneTarget, brief?: CopyBrief) => {
      if (usingKey) return;
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
          router[replace ? 'replace' : 'push']({
            pathname: `/code-editor/${open}`,
            params: {
              tenantId: String(app.id),
              tenantUid: app.uuid,
              appType: app.app_type ?? template.app_type,
              // "Customise with AI": the agent starts on the copy with the
              // user's brief (and their logo attached) as its first message.
              ...(brief
                ? {
                    userPrompt: brief.prompt,
                    images: JSON.stringify(brief.images),
                  }
                : null),
            },
          } as never);
        },
        onError: (error) => {
          endEta(eta, false);
          cloneFailed(error, () => copy(template, brief), showLimit);
        },
        onSettled: () => setUsingKey(null),
      });
    },
    [usingKey, clone, router, replace, open, showLimit]
  );

  const use = React.useCallback(
    (template: MarketTemplate) => {
      if (template.kind === 'code') copy(template);
    },
    [copy]
  );

  return { use, copy, usingKey };
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
