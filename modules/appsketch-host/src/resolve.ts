/**
 * Turns whatever the user scanned or tapped into a bundle the host can run.
 *
 * Accepted inputs:
 *  - a workspace's https preview: `https://appsketch.ai/preview/<uuid>/`
 *    (Metro behind the site's proxy, port 443 — what the builder and shared
 *    links use, since many networks block the tunnel's own ports);
 *  - a Coder workspace QR: `exp://host:port` (Metro, live) — Expo Go's own
 *    sign-in params are stripped, the host doesn't need them;
 *  - a published template: `https://…/builds/<uuid>/native/manifest.json`;
 *  - our own deep link: `<scheme>://open?url=<one of the above>`.
 *
 * Both sources end up as an expo-updates-shaped manifest. The native side hands
 * that manifest to the guest's expo-constants (via the `ExpoUpdates` shim), so
 * `Constants.expoConfig` is the guest app's own app.json, not AppSketch's.
 */
import { Platform } from 'react-native';

/** Major Expo SDK the host's native code is built against. */
export const HOST_SDK_MAJOR = 57;

export type ResolvedGuestApp = {
  /** Plain-JS production bundle. Assets resolve against its origin. */
  bundleUrl: string;
  /** expo-updates manifest (JSON) passed to the guest's expo-constants. */
  manifest: string;
  title: string;
  /** 'live' = a running Coder workspace (Metro), 'published' = a template build. */
  source: 'live' | 'published';
};

export class GuestAppError extends Error {
  constructor(
    message: string,
    readonly code: 'bad-url' | 'unreachable' | 'sdk-mismatch' | 'bad-manifest'
  ) {
    super(message);
  }
}

type UpdatesManifest = {
  id?: string;
  createdAt?: string;
  runtimeVersion?: string;
  launchAsset?: { url?: string };
  metadata?: object;
  extra?: { expoClient?: Record<string, any> } & Record<string, any>;
};

type PublishedManifest = {
  sdkVersion?: string;
  runtimeVersion?: string;
  bundles?: { ios?: string; android?: string };
  expoConfig?: Record<string, any>;
  builtAt?: string;
  codeVersion?: string;
};

const EXPO_GO_PARAMS = [
  'expo_go_prompt_device_auth',
  'expo_go_device_auth_verification_uri_override',
];

/** Normalises a scanned string to the http(s) URL to fetch the manifest from. */
export function manifestUrlFrom(input: string): string {
  let raw = input.trim();
  const deep = raw.match(/^[a-z][a-z0-9+.-]*:\/\/open\/?\?(.*)$/i);
  if (deep && !/^(exp|exps|https?):/i.test(raw)) {
    const inner = new URLSearchParams(deep[1]).get('url');
    if (!inner)
      throw new GuestAppError('This link has no app in it.', 'bad-url');
    raw = inner;
  }
  if (/^exps:\/\//i.test(raw)) raw = 'https://' + raw.slice('exps://'.length);
  else if (/^exp:\/\//i.test(raw)) raw = 'http://' + raw.slice('exp://'.length);
  if (!/^https?:\/\//i.test(raw)) {
    throw new GuestAppError(
      "That code isn't an AppSketch app link.",
      'bad-url'
    );
  }
  const url = new URL(raw);
  for (const p of EXPO_GO_PARAMS) url.searchParams.delete(p);
  return url.toString();
}

function sdkMajor(m: {
  sdkVersion?: string;
  runtimeVersion?: string;
}): number | null {
  const v = m.sdkVersion ?? m.runtimeVersion?.replace(/^exposdk:/, '');
  const major = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(major) ? major : null;
}

function assertSdk(major: number | null) {
  if (major !== null && major !== HOST_SDK_MAJOR) {
    throw new GuestAppError(
      `This app was built for Expo SDK ${major}; AppSketch runs SDK ${HOST_SDK_MAJOR} apps. ` +
        'Update the app in the builder, or update AppSketch.',
      'sdk-mismatch'
    );
  }
}

/** Metro serves dev bundles; the host runs release native code, so ask for a production one. */
function productionBundleUrl(launchUrl: string): string {
  const url = new URL(launchUrl);
  url.searchParams.set('dev', 'false');
  url.searchParams.set('hot', 'false');
  url.searchParams.set('minify', 'true');
  url.searchParams.delete('lazy');
  return url.toString();
}

/** Metro answers `Accept: multipart/mixed` with parts; take the one named "manifest". */
function parseManifestBody(body: string, contentType: string): unknown {
  const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1];
  if (!boundary) return JSON.parse(body);
  for (const part of body.split(`--${boundary}`)) {
    if (!/name="manifest"/i.test(part)) continue;
    const start = part.indexOf('\r\n\r\n');
    return JSON.parse(part.slice(start + 4).trim());
  }
  throw new GuestAppError('The app server sent no manifest.', 'bad-manifest');
}

type ManifestBody = UpdatesManifest & PublishedManifest;
type Platformish = 'ios' | 'android';

/** `/preview/<uuid>` when the URL is a workspace's https preview, else null. */
export function previewPathOf(url: string): string | null {
  const m = new URL(url).pathname.match(/^(\/preview\/[^/]+)\/?$/);
  return m ? m[1] : null;
}

/** How long to wait for a sleeping workspace to boot its dev server. */
const BOOT_WAIT_MS = 120_000;
const BOOT_POLL_MS = 3_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Whether this answer means "a workspace preview is still booting". */
function isBooting(res: Response): boolean {
  const html = (res.headers.get('content-type') ?? '').includes('text/html');
  return html || res.status === 502 || res.status === 503 || res.status === 504;
}

function requestManifest(manifestUrl: string, platform: Platformish) {
  return fetch(manifestUrl, {
    headers: {
      'expo-platform': platform,
      'expo-protocol-version': '0',
      accept: 'application/expo+json,application/json',
    },
  });
}

/**
 * A workspace preview that is asleep answers with its boot page (HTML) while
 * the runner starts Metro; each request also counts as a wake-up. Keep asking
 * until the manifest arrives.
 */
async function requestPreviewManifest(
  manifestUrl: string,
  platform: Platformish
): Promise<Response> {
  const deadline = Date.now() + BOOT_WAIT_MS;
  for (;;) {
    try {
      const res = await requestManifest(manifestUrl, platform);
      if (!isBooting(res)) return res;
    } catch {
      // network blip while the proxy swaps upstreams: try again
    }
    if (Date.now() > deadline) {
      throw new GuestAppError(
        'Your app is taking too long to start. Try again in a minute.',
        'unreachable'
      );
    }
    await sleep(BOOT_POLL_MS);
  }
}

async function fetchManifest(
  manifestUrl: string,
  platform: Platformish
): Promise<ManifestBody> {
  let res: Response;
  try {
    res = previewPathOf(manifestUrl)
      ? await requestPreviewManifest(manifestUrl, platform)
      : await requestManifest(manifestUrl, platform);
  } catch (e) {
    if (e instanceof GuestAppError) throw e;
    throw new GuestAppError(
      "Couldn't reach the app. If it's a live workspace, open it in the builder so it wakes up, then scan again.",
      'unreachable'
    );
  }
  // A backend without the native export falls through to the website, which
  // answers 200 with its HTML page: that is "not exported" too.
  const html = (res.headers.get('content-type') ?? '').includes('text/html');
  if (res.status === 404 || html) {
    throw new GuestAppError(
      "This app can't run on the phone yet.",
      'unreachable'
    );
  }
  if (!res.ok) {
    throw new GuestAppError(
      `The app server answered ${res.status}.`,
      'unreachable'
    );
  }
  try {
    return parseManifestBody(
      await res.text(),
      res.headers.get('content-type') ?? ''
    ) as ManifestBody;
  } catch (e) {
    if (e instanceof GuestAppError) throw e;
    throw new GuestAppError(
      "The app's manifest couldn't be read.",
      'bad-manifest'
    );
  }
}

/** A published template (backend native export) → an updates-style manifest. */
function fromPublished(
  data: ManifestBody,
  manifestUrl: string,
  platform: Platformish
): ResolvedGuestApp {
  const bundle = data.bundles?.[platform];
  if (!bundle) {
    throw new GuestAppError(
      `This app has no ${platform} build yet.`,
      'bad-manifest'
    );
  }
  assertSdk(sdkMajor(data));
  const bundleUrl = new URL(bundle, manifestUrl).toString();
  const expoClient = data.expoConfig ?? {};
  const manifest: UpdatesManifest = {
    id: data.codeVersion ?? bundleUrl,
    createdAt: data.builtAt ?? new Date().toISOString(),
    runtimeVersion: data.runtimeVersion ?? `exposdk:${HOST_SDK_MAJOR}.0.0`,
    launchAsset: { url: bundleUrl },
    metadata: {},
    extra: { expoClient },
  };
  return {
    bundleUrl,
    manifest: JSON.stringify(manifest),
    title: expoClient.name ?? 'App',
    source: 'published',
  };
}

/**
 * Metro names its own tunnel address in `launchAsset`. When the manifest came
 * through the https preview, load the bundle through it too: same Metro, but
 * port 443, which every network allows. Assets follow, since they resolve
 * against the bundle's origin and already carry the `/preview/<uuid>` base.
 */
function viaPreview(launchUrl: string, manifestUrl: string): string {
  const path = previewPathOf(manifestUrl);
  if (!path) return launchUrl;
  const launch = new URL(launchUrl);
  const origin = new URL(manifestUrl).origin;
  return `${origin}${path}${launch.pathname}${launch.search}`;
}

/** A live Coder workspace's Metro manifest, pointed at a production bundle. */
function fromMetro(data: ManifestBody, manifestUrl: string): ResolvedGuestApp {
  const launch = data.launchAsset?.url;
  if (!launch) {
    throw new GuestAppError(
      "The app's manifest has no bundle.",
      'bad-manifest'
    );
  }
  const expoClient = data.extra?.expoClient ?? {};
  assertSdk(
    sdkMajor({
      sdkVersion: expoClient.sdkVersion,
      runtimeVersion: data.runtimeVersion,
    })
  );
  const bundleUrl = productionBundleUrl(viaPreview(launch, manifestUrl));
  return {
    bundleUrl,
    manifest: JSON.stringify({
      ...data,
      metadata: data.metadata ?? {},
      launchAsset: { ...data.launchAsset, url: bundleUrl },
    }),
    title: expoClient.name ?? 'App',
    source: 'live',
  };
}

export async function resolveGuestApp(
  input: string
): Promise<ResolvedGuestApp> {
  const manifestUrl = manifestUrlFrom(input);
  const platform: Platformish = Platform.OS === 'ios' ? 'ios' : 'android';
  const data = await fetchManifest(manifestUrl, platform);
  return data.bundles
    ? fromPublished(data, manifestUrl, platform)
    : fromMetro(data, manifestUrl);
}
