import { Platform } from 'react-native';

import { GuestAppError, manifestUrlFrom, resolveGuestApp } from './resolve';

const metroManifest = {
  id: 'abc',
  createdAt: '2026-10-21T00:00:00.000Z',
  runtimeVersion: 'exposdk:57.0.0',
  launchAsset: {
    key: 'bundle',
    contentType: 'application/javascript',
    url: 'http://tunnel.appsketch.ai:8100/node_modules/expo-router/entry.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.routerRoot=app',
  },
  assets: [],
  metadata: {},
  extra: {
    expoClient: {
      name: 'Zaika',
      sdkVersion: '57.0.0',
      extra: { tenantId: '11315' },
    },
  },
};

function mockFetch(
  body: unknown,
  init: { status?: number; contentType?: string } = {}
) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  global.fetch = jest.fn().mockResolvedValue({
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers: { get: () => init.contentType ?? 'application/expo+json' },
    text: () => Promise.resolve(text),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  Platform.OS = 'ios';
});

describe('manifestUrlFrom', () => {
  it('turns exp:// into http and drops Expo Go sign-in params', () => {
    expect(
      manifestUrlFrom(
        'exp://tunnel.appsketch.ai:8104?expo_go_prompt_device_auth=1&expo_go_device_auth_verification_uri_override=https%3A%2F%2Fx'
      )
    ).toBe('http://tunnel.appsketch.ai:8104/');
  });

  it('turns exps:// into https', () => {
    expect(
      manifestUrlFrom('exps://appsketch.ai/builds/u/native/manifest.json')
    ).toBe('https://appsketch.ai/builds/u/native/manifest.json');
  });

  it('unwraps an AppSketch deep link', () => {
    expect(
      manifestUrlFrom(
        'appsketch-ecommerce://open?url=exp%3A%2F%2Ftunnel.appsketch.ai%3A8100'
      )
    ).toBe('http://tunnel.appsketch.ai:8100/');
  });

  it('rejects text that is not an app link', () => {
    expect(() => manifestUrlFrom('hello')).toThrow(GuestAppError);
  });
});

describe('resolveGuestApp', () => {
  it('asks Metro for a production bundle and keeps the guest config', async () => {
    mockFetch(metroManifest);
    const app = await resolveGuestApp('exp://tunnel.appsketch.ai:8100');

    const sent = (global.fetch as jest.Mock).mock.calls[0];
    expect(sent[0]).toBe('http://tunnel.appsketch.ai:8100/');
    expect(sent[1].headers['expo-platform']).toBe('ios');

    const bundle = new URL(app.bundleUrl);
    expect(bundle.searchParams.get('dev')).toBe('false');
    expect(bundle.searchParams.get('minify')).toBe('true');
    expect(bundle.searchParams.has('lazy')).toBe(false);
    expect(bundle.searchParams.get('transform.routerRoot')).toBe('app');

    const manifest = JSON.parse(app.manifest);
    expect(manifest.metadata).toEqual({});
    expect(manifest.launchAsset.url).toBe(app.bundleUrl);
    expect(manifest.extra.expoClient.extra.tenantId).toBe('11315');
    expect(app).toMatchObject({ title: 'Zaika', source: 'live' });
  });

  it('reads a multipart Metro response', async () => {
    const body =
      '--abc\r\ncontent-type: application/json\r\ncontent-disposition: form-data; name="manifest"\r\n\r\n' +
      JSON.stringify(metroManifest) +
      '\r\n--abc--';
    mockFetch(body, { contentType: 'multipart/mixed; boundary=abc' });
    const app = await resolveGuestApp('exp://tunnel.appsketch.ai:8100');
    expect(app.title).toBe('Zaika');
  });
});

describe('resolveGuestApp, published and failing', () => {
  it('builds an updates-style manifest for a published template', async () => {
    Platform.OS = 'android';
    mockFetch({
      sdkVersion: '57.0.0',
      bundles: { ios: 'ios/index.js', android: 'android/index.js' },
      expoConfig: { name: 'Nimbl', extra: { tenantId: '11436' } },
      codeVersion: 'v9',
    });
    const app = await resolveGuestApp(
      'https://appsketch.ai/builds/u1/native/manifest.json'
    );
    expect(app.bundleUrl).toBe(
      'https://appsketch.ai/builds/u1/native/android/index.js'
    );
    const manifest = JSON.parse(app.manifest);
    expect(manifest.metadata).toEqual({});
    expect(manifest.extra.expoClient.extra.tenantId).toBe('11436');
    expect(app.source).toBe('published');
  });

  it('refuses an app built for another SDK', async () => {
    mockFetch({
      ...metroManifest,
      runtimeVersion: 'exposdk:58.0.0',
      extra: { expoClient: { name: 'X', sdkVersion: '58.0.0' } },
    });
    await expect(resolveGuestApp('exp://h:1')).rejects.toMatchObject({
      code: 'sdk-mismatch',
    });
  });

  it('explains an unreachable workspace', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));
    await expect(resolveGuestApp('exp://h:1')).rejects.toMatchObject({
      code: 'unreachable',
    });
  });
});

describe('resolveGuestApp, workspace preview over https', () => {
  const preview =
    'https://appsketch.ai/preview/e1dc7a9d-dd73-483f-8e7a-7c1ae2a61399/';

  it('loads the bundle through the preview path, not the tunnel port', async () => {
    mockFetch(metroManifest);
    const app = await resolveGuestApp(preview);
    expect(app.source).toBe('live');
    expect(app.bundleUrl).toMatch(
      /^https:\/\/appsketch\.ai\/preview\/e1dc7a9d-dd73-483f-8e7a-7c1ae2a61399\/node_modules\/expo-router\/entry\.bundle\?/
    );
    expect(app.bundleUrl).toContain('dev=false');
    expect(app.bundleUrl).not.toContain('tunnel.appsketch.ai');
  });

  it('waits while the workspace shows its boot page', async () => {
    jest.useFakeTimers();
    const boot = {
      ok: true,
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
      text: () => Promise.resolve('<html>booting</html>'),
    };
    const ready = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/expo+json' },
      text: () => Promise.resolve(JSON.stringify(metroManifest)),
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(boot)
      .mockResolvedValueOnce(ready) as unknown as typeof fetch;
    const pending = resolveGuestApp(preview);
    await jest.advanceTimersByTimeAsync(3_000);
    const app = await pending;
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(app.title).toBe('Zaika');
    jest.useRealTimers();
  });
});
