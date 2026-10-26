import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { isMobile } from '@/containers/Home/TemplateReel/layout';
import {
  useRunApp,
  useTemplatePreview,
} from '@/containers/Marketplace/use-template-preview';

import type { Cta } from './cta-bar';
import { useUseTemplate } from './use-use-template';

/**
 * The page's actions.
 * - An app: ONE button, "Run it live" — natively here when it has bundles
 *   for this host, else its live web render (useRunApp), with the ETA
 *   loader either way. Apps are not cloned from this page.
 * - A website: "Try it live" (its live site) + "Use this template" (clone).
 * - A layout site: "Preview site" (created on the preview screen).
 * A web app without a live URL gets no primary; the clone stands alone.
 */
export function useCtas(template: MarketTemplate) {
  const preview = useTemplatePreview();
  const runApp = useRunApp();
  const { use, busy, available } = useUseTemplate(template);
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

  const secondary = React.useMemo<Cta | null>(() => {
    if (!available || app) return null;
    const eco = template.kind === 'code' && !!template.ecosystem;
    return {
      label: eco ? 'Use ecosystem' : 'Use this template',
      onPress: use,
      busy,
    };
  }, [available, app, template, use, busy]);

  return { primary, secondary };
}
