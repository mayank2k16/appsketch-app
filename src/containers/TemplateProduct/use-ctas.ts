import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { isMobile } from '@/containers/Home/TemplateReel/layout';
import { useTemplatePreview } from '@/containers/Marketplace/use-template-preview';

import type { Cta } from './cta-bar';
import { useUseTemplate } from './use-use-template';

/**
 * The page's two actions, wired exactly as the Market wires them:
 * primary = `useTemplatePreview` (a mobile app runs natively here, a web
 * app opens its live site, a layout site is created on the preview screen);
 * secondary = clone ("Use this template"), code templates only. A web app
 * without a live URL gets no primary (the Market's Preview would only toast)
 * — the clone button then stands alone.
 */
export function useCtas(template: MarketTemplate) {
  const preview = useTemplatePreview();
  const { use, busy, available } = useUseTemplate(template);

  const primary = React.useMemo<Cta | null>(() => {
    const run = () => preview(template);
    if (template.kind === 'layout')
      return { label: 'Preview site', onPress: run };
    if (isMobile(template)) return { label: 'Run it live', onPress: run };
    if (template.preview_url) return { label: 'Try it live', onPress: run };
    return null;
  }, [preview, template]);

  const secondary = React.useMemo<Cta | null>(() => {
    if (!available) return null;
    const eco = template.kind === 'code' && !!template.ecosystem;
    return {
      label: eco ? 'Use ecosystem' : 'Use this template',
      onPress: use,
      busy,
    };
  }, [available, template, use, busy]);

  return { primary, secondary };
}
