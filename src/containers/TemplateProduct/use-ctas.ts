import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { isMobile } from '@/containers/Home/TemplateReel/layout';
import {
  useRunApp,
  useTemplatePreview,
} from '@/containers/Marketplace/use-template-preview';
import { usePricing } from '@/containers/Pricing/use-pricing';

import type { Cta } from './cta-bar';
import { useBuyTemplate } from './use-buy-template';
import { useCloneAndOpen } from './use-use-template';

/**
 * The page's actions.
 * - "Customise with AI": the template is copied into the user's account
 *   and the builder opens on its AI chat (use-use-template.ts).
 * - "Buy plan" (use-buy-template.ts), the page's focus, with what a plan
 *   unlocks under it ("1000+ templates · from ₹1,250/mo", the yearly Basic
 *   price): the cart with the Basic plan billed yearly, then Subscribe.
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
  const fromPrice = usePlanFrom();

  const primary = React.useMemo<Cta | null>(() => {
    if (template.kind === 'layout')
      return { label: 'Preview site', onPress: () => preview(template) };
    return {
      label: 'Customise with AI',
      icon: 'sparkles',
      busy: customise.usingKey === template.key,
      onPress: () => customise.use(template),
    };
  }, [preview, template, customise]);

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

  const secondary = React.useMemo<Cta | null>(
    () =>
      available
        ? {
            label: 'Buy plan',
            sub: `Unlock 1000+ templates · from ${fromPrice}/mo`,
            onPress: buy,
            busy,
            accent: true,
          }
        : null,
    [available, buy, busy, fromPrice]
  );

  return { primary, secondary, run };
}

/** The yearly Basic plan's monthly price ("₹1,250"), for "from …/mo". */
function usePlanFrom() {
  const data = usePricing('yearly');
  const basic = data.views.find((v) => v.tier === 'basic');
  return (basic?.monthlyEquivalent ?? '₹1,250').replace(/[.,]00(?=\D*$)/, '');
}
