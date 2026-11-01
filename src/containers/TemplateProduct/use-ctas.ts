import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { isMobile } from '@/containers/Home/TemplateReel/layout';
import {
  useRunApp,
  useTemplatePreview,
} from '@/containers/Marketplace/use-template-preview';

import type { Cta } from './cta-bar';
import { useBuyTemplate } from './use-buy-template';

/**
 * The page's actions.
 * - An app: "Run it live" — natively here when it has bundles for this
 *   host, else its live web render (useRunApp), with the ETA loader either
 *   way — + "Buy now".
 * - A website: "Try it live" (its live site) + "Buy now".
 * "Buy now" (use-buy-template.ts): paid plan → copy + builder; otherwise
 * the cart with the Basic plan, then copy + builder once it is active.
 * - A layout site: "Preview site" (created on the preview screen).
 * A web app without a live URL gets no primary; the clone stands alone.
 */
export function useCtas(template: MarketTemplate) {
  const preview = useTemplatePreview();
  const runApp = useRunApp();
  const { buy, busy, available } = useBuyTemplate(template);
  const app = isMobile(template);

  const primary = React.useMemo<Cta | null>(() => {
    const run = () => preview(template);
    if (template.kind === 'layout')
      return { label: 'Preview site', onPress: run };
    if (app && template.kind === 'code')
      return {
        label: 'Run it live',
        busy: runApp.opening,
        onPress: () => void runApp.run(template),
      };
    if (template.preview_url) return { label: 'Try it live', onPress: run };
    return null;
  }, [preview, template, app, runApp]);

  const secondary = React.useMemo<Cta | null>(
    () =>
      available ? { label: 'Buy now', onPress: buy, busy, accent: true } : null,
    [available, buy, busy]
  );

  return { primary, secondary };
}
