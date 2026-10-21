import { requireOptionalNativeModule } from 'expo-modules-core';

import { type ResolvedGuestApp, resolveGuestApp } from './resolve';

type NativeHost = {
  /** Expo SDK the native side was built with, e.g. "57.0.0". */
  sdkVersion: string;
  openApp(options: {
    bundleUrl: string;
    manifest: string;
    title: string;
  }): Promise<void>;
};

const Native = requireOptionalNativeModule<NativeHost>('AppSketchHost');

/** False on web and in builds made before the host module existed. */
export function isGuestHostAvailable(): boolean {
  return Native != null;
}

/** Runs an already-resolved app full screen. Resolves once it is on screen. */
export async function launchGuestApp(app: ResolvedGuestApp): Promise<void> {
  if (!Native) throw new Error('This build of AppSketch cannot run apps.');
  await Native.openApp({
    bundleUrl: app.bundleUrl,
    manifest: app.manifest,
    title: app.title,
  });
}

/** Scanned QR / manifest URL → running app. */
export async function openGuestApp(input: string): Promise<ResolvedGuestApp> {
  const app = await resolveGuestApp(input);
  await launchGuestApp(app);
  return app;
}
