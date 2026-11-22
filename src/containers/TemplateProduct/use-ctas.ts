import { useRouter } from 'expo-router';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { hasPaidPlan } from '@/containers/AppCart/use-cart-totals';
import { isMobile, titleOf } from '@/containers/Home/TemplateReel/layout';
import {
  useRunApp,
  useTemplatePreview,
} from '@/containers/Marketplace/use-template-preview';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

import type { Cta } from './cta-bar';
import { customisePrompt, useCustomiseHandoff } from './customise-brief';
import { allowanceLine, useAllowance, useEnsureSlot } from './template-slot';
import { useBuyTemplate } from './use-buy-template';
import { useCloneAndOpen } from './use-use-template';

/**
 * The page's actions.
 * - "Customise with AI": a form (logo, business name, description), then
 *   the template is copied and the builder opens on its AI chat with that
 *   brief as the agent's first message (customise-brief.ts).
 * - "Buy plan" (use-buy-template.ts), the page's focus, with "Unlock 1000+
 *   templates" under its label: the cart with the Basic plan billed
 *   yearly, then Subscribe. Someone already on a paid plan sees "Use this
 *   template" there instead, with their allowance under it ("3 of 8 used
 *   on Basic"): it copies the template, or — allowance used up — opens
 *   /template-limit (upgrade, or delete an app to continue).
 * - An app keeps "Run it live" as a play button beside them (natively when
 *   it has bundles for this host, else its live web render). A website's
 *   "Try it live" is gone: the hero already plays the live site.
 * - A layout site: "Preview site" (created on the preview screen).
 */
export function useCtas(template: MarketTemplate) {
  const preview = useTemplatePreview();
  const runApp = useRunApp();
  const { buy, busy, available } = useBuyTemplate(template);
  const customise = useCloneAndOpen({ open: 'chat' });
  const app = isMobile(template);

  const form = useCustomiseForm(template, customise);

  const primary = React.useMemo<Cta | null>(() => {
    if (template.kind === 'layout')
      return { label: 'Preview site', onPress: () => preview(template) };
    return {
      label: 'Customise with AI',
      icon: 'sparkles',
      busy: customise.usingKey === template.key,
      onPress: form.show,
    };
  }, [preview, template, customise.usingKey, form.show]);

  const run = React.useMemo<Cta | null>(
    () =>
      app && template.kind === 'code'
        ? {
            label: 'Run it live',
            icon: 'play',
            busy: runApp.opening,
            onPress: () => void runApp.run(template),
          }
        : null,
    [app, template, runApp]
  );

  const secondary = useBuyOrUse(template, { buy, busy, available });

  return { primary, secondary, run };
}

/** "Customise with AI": opens the form sheet (/customise; signed-out users
 *  sign in first) and, when it hands a form back for this template, copies
 *  the template with that brief for the builder's agent. */
function useCustomiseForm(
  template: MarketTemplate,
  customise: ReturnType<typeof useCloneAndOpen>
) {
  const router = useRouter();
  const ensure = useEnsureSlot();
  const pending = useCustomiseHandoff((h) => h.pending);
  const show = React.useCallback(() => {
    if (useAuth.getState().status !== 'signIn') {
      toast.info('Sign in to customise this template.');
      router.push({ pathname: '/welcome', params: { return: '1' } } as never);
      return;
    }
    // No point filling the form when the copy would be refused: the limit
    // sheet first, then the form once a slot is free.
    void ensure(() =>
      router.push({
        pathname: '/customise',
        params: { key: template.key, name: titleOf(template) },
      } as never)
    );
  }, [router, template, ensure]);

  // A ref: taking the hand-off re-renders, and the copy must not be
  // cancelled by that render's effect cleanup.
  const copyRef = React.useRef(customise.copy);
  copyRef.current = customise.copy;
  React.useEffect(() => {
    if (!pending || pending.key !== template.key || template.kind !== 'code')
      return;
    useCustomiseHandoff.getState().take();
    const brief = {
      prompt: customisePrompt(titleOf(template), pending.form),
      images: pending.form.logo ? [pending.form.logo] : [],
    };
    // Let the sheet slide away before the copy's loader and the builder.
    setTimeout(() => copyRef.current(template, brief), 400);
  }, [pending, template]);

  return { show };
}

/** "Buy plan" for everyone not on a paid plan; "Use this template" (with
 *  their allowance under it) for those who are. */
function useBuyOrUse(
  template: MarketTemplate,
  b: { buy: () => void; busy: boolean; available: boolean }
) {
  const paid = hasPaidPlan(getUserSubscription(useAuth.use.user()));
  const allowance = useAllowance();
  const ensure = useEnsureSlot();
  const { use, usingKey } = useCloneAndOpen();
  return React.useMemo<Cta | null>(() => {
    if (!b.available) return null;
    if (!paid)
      return {
        label: 'Buy plan',
        sub: 'Unlock 1000+ templates',
        onPress: b.buy,
        busy: b.busy,
        accent: true,
      };
    return {
      label: 'Use this template',
      sub: allowanceLine(allowance) ?? 'Included in your plan',
      onPress: () => void ensure(() => use(template)),
      busy: usingKey === template.key,
      accent: true,
    };
  }, [b, paid, allowance, ensure, use, usingKey, template]);
}
