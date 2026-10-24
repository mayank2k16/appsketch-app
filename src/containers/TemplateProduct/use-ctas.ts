import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { isMobile } from '@/containers/Home/TemplateReel/layout';
import { useTemplatePreview } from '@/containers/Marketplace/use-template-preview';
import { useOpenGuestApp } from '@/lib/guest-app';

import type { Cta } from './cta-bar';
import { useUseTemplate } from './use-use-template';

/** A published app's JS bundles for this host (docs/in-app-host.md). */
const nativeManifestUrl = (uuid: string) =>
  `https://appsketch.ai/api/builder/coder/native/${uuid}/manifest.json`;

/**
 * The page's actions.
 * - An app: ONE button, "Use app" — it runs natively here (spinner while
 *   it downloads; a failure shows as an alert, never silently). Apps are
 *   not cloned from this page.
 * - A website: "Try it live" (its live site) + "Use this template" (clone).
 * - A layout site: "Preview site" (created on the preview screen).
 * A web app without a live URL gets no primary; the clone stands alone.
 */
export function useCtas(template: MarketTemplate) {
  const preview = useTemplatePreview();
  const guest = useOpenGuestApp();
  const { use, busy, available } = useUseTemplate(template);
  const app = isMobile(template);

  const primary = React.useMemo<Cta | null>(() => {
    const run = () => preview(template);
    if (template.kind === 'layout')
      return { label: 'Preview site', onPress: run };
    if (app && template.kind === 'code')
      return {
        label: 'Use app',
        busy: guest.opening,
        onPress: () =>
          void guest.open(
            template.native_manifest_url || nativeManifestUrl(template.uuid),
            { alert: true }
          ),
      };
    if (template.preview_url) return { label: 'Try it live', onPress: run };
    return null;
  }, [preview, template, app, guest]);

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
