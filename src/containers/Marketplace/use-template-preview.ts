import { useRouter } from 'expo-router';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { useOpenGuestApp } from '@/lib/guest-app';
import { toast } from '@/lib/toast';

/** A published mobile app's JS bundles, exported for this host by the
 * backend (docs/in-app-host.md, "Published templates"). */
const nativeManifestUrl = (uuid: string) =>
  `https://appsketch.ai/api/builder/coder/native/${uuid}/manifest.json`;

/**
 * "Preview" / "Try app" on a template, exactly as the Market card does it —
 * shared so Home's template carousel opens a template the same way:
 * a layout site is created on the preview screen, a mobile app runs natively
 * here, a web app opens its live site.
 */
export function useTemplatePreview() {
  const router = useRouter();
  const guest = useOpenGuestApp();
  return React.useCallback(
    (template: MarketTemplate) => {
      if (template.kind === 'layout') {
        // Navigate immediately — the create-tenant-from-template call (~4-7s)
        // runs on the destination screen instead of blocking this tap on a
        // spinner. See AppPreviewScreen's "creating" phase.
        router.push({
          pathname: '/app-preview',
          params: { templateId: String(template.id), name: template.name },
        } as never);
        return;
      }
      if (template.app_type === 'mobile') {
        // A mobile app runs natively here, the way a workspace QR does.
        guest.open(
          template.native_manifest_url || nativeManifestUrl(template.uuid)
        );
        return;
      }
      if (!template.preview_url) {
        toast.info('This template has no live preview yet.');
        return;
      }
      router.push({
        pathname: '/app-preview',
        params: { url: template.preview_url, name: template.title },
      } as never);
    },
    [router, guest]
  );
}
