import { useRouter } from 'expo-router';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { useOpenGuestApp } from '@/lib/guest-app';
import { toast } from '@/lib/toast';

/** A published mobile app's JS bundles, exported for this host by the
 * backend (docs/in-app-host.md, "Published templates"). */
export const nativeManifestUrl = (uuid: string) =>
  `https://appsketch.ai/api/builder/coder/native/${uuid}/manifest.json`;

/** The app's own web render (the web-runner's Expo web build). */
export const appWebUrl = (uuid: string) =>
  `https://appsketch.ai/preview/${uuid}/`;

type RunnableApp = {
  uuid?: string;
  title?: string;
  native_manifest_url?: string | null;
};

/**
 * "Run it live" for a mobile app: natively on this phone when the app has
 * JS bundles for this host; otherwise — no export yet, or a host too old to
 * run one — its live web render in the app preview, so the button always
 * runs the app instead of ending in "can't run on the phone yet".
 */
export function useRunApp() {
  const router = useRouter();
  const guest = useOpenGuestApp();
  const { open } = guest;
  const run = React.useCallback(
    async (app: RunnableApp) => {
      if (!app.uuid) {
        toast.info('This app has no live preview yet.');
        return;
      }
      const native = await open(
        app.native_manifest_url || nativeManifestUrl(app.uuid),
        { quiet: true }
      );
      if (native) return;
      router.push({
        pathname: '/app-preview',
        params: { url: appWebUrl(app.uuid), name: app.title || 'App' },
      } as never);
    },
    [open, router]
  );
  return { run, opening: guest.opening };
}

/**
 * "Preview" / "Try app" on a template, exactly as the Market card does it —
 * shared so Home's template carousel opens a template the same way:
 * a layout site is created on the preview screen, a mobile app runs live
 * (useRunApp), a web app opens its live site.
 */
export function useTemplatePreview() {
  const router = useRouter();
  const { run } = useRunApp();
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
        void run(template);
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
    [router, run]
  );
}
