import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { F } from '@/lib/fonts';

import {
  FIT_SCRIPT,
  READY_SCRIPT,
  SWIPE_GUARD_SCRIPT,
} from './autoscroll-script';
import { DotVeil } from './dot-loader';
import { type Device, VIEWPORT } from './live-url';

/**
 * The hero's live layer: the template's LIVE site in a WebView, over the
 * loader. It mounts as soon as its page is the current one (in parallel
 * with the grow, hidden behind the loader) and crossfades in (~200ms) only
 * once the page says its first screen has painted — content, fonts and the
 * first viewport's images (READY_SCRIPT) — never half-rendered. A
 * neighbour can mount it early too (`warm`): it loads hidden and paused,
 * so a swipe lands on a site that is already up.
 *
 * On the current page the site is the user's: vertical drags scroll it and
 * taps work (links, menus; navigation stays inside the WebView). It does
 * not scroll by itself, and never sideways: horizontal drags belong to the
 * pager (SWIPE_GUARD_SCRIPT). The scale transform maps
 * touches back to the right element at Tablet / Desktop widths too.
 *
 * Recovery: if iOS kills the page's web process (memory pressure — the
 * classic blank white WebView) or Android's renderer goes, the layer
 * remounts and loads again by itself. A 4xx/5xx or a network failure shows
 * "Preview unavailable" with Retry instead of a blank panel.
 *
 * Mobile lays out at the panel's own width (a phone width) with no
 * transform, so it scrolls natively. Tablet / Desktop render at their real
 * CSS width (820 / 1280) and are scaled to the hero's width with a transform, so the site lays itself
 * out exactly as on that device, fitted to the panel's inside (its border
 * excluded) so a 1280px Desktop page is never clipped. Switching device
 * mounts the new width on top at once; until it has painted, the old one
 * stays under a frosted veil with the orange dot ripple (dot-loader.tsx),
 * then the new one fades in over both (~200ms) and the old one is dropped.
 */

/** The loader → site crossfade. */
const FADE_MS = 200;

const SCRIPT = FIT_SCRIPT + SWIPE_GUARD_SCRIPT + READY_SCRIPT;

type Size = { width: number; height: number };

type LayerProps = {
  url: string;
  size: Size;
  device: Device;
  /** Takes touches (the centred page). */
  interactive: boolean;
  dark: boolean;
  onReady: (device: Device) => void;
};

function useReveal(device: Device, onReady: (d: Device) => void) {
  const shown = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
  }));
  const done = React.useRef(false);
  const reveal = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    const ease = { duration: FADE_MS, easing: Easing.out(Easing.quad) };
    shown.value = withTiming(1, ease, (f) => {
      if (f) runOnJS(onReady)(device);
    });
  }, [shown, onReady, device]);
  return { style, reveal };
}

/** Remounts the WebView after its process died; `failed` after an HTTP or
 *  network error (until Retry). */
function useRecovery() {
  const [gen, setGen] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const remount = React.useCallback(() => {
    setFailed(false);
    setGen((g) => g + 1);
  }, []);
  const fail = React.useCallback(() => setFailed(true), []);
  return { gen, failed, remount, fail };
}

function Unavailable({
  onRetry,
  dark,
}: {
  onRetry: () => void;
  dark: boolean;
}) {
  return (
    <View style={[s.down, dark && s.downDark]}>
      <Text style={[s.downTitle, dark && s.inkDark]}>Preview unavailable</Text>
      <Text style={[s.downSub, dark && s.subDark]}>
        The live site didn’t load.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        hitSlop={8}
        style={[s.retry, dark && s.retryDark]}
      >
        <Text style={[s.retryText, dark && s.retryTextDark]}>Retry</Text>
      </Pressable>
    </View>
  );
}

const LiveLayer = React.memo(function LiveLayer(p: LayerProps) {
  const rec = useRecovery();
  if (rec.failed) return <Unavailable onRetry={rec.remount} dark={p.dark} />;
  return (
    <LiveWeb key={rec.gen} {...p} onGone={rec.remount} onFail={rec.fail} />
  );
});

/** iOS can skip `injectedJavaScript`, so the scripts are injected again on
 *  load; each installs once per document. */
function useInject(ref: React.RefObject<WebView | null>) {
  return React.useCallback(() => {
    ref.current?.injectJavaScript(SCRIPT);
  }, [ref]);
}

const LiveWeb = React.memo(function LiveWeb(
  p: LayerProps & { onGone: () => void; onFail: () => void }
) {
  const ref = React.useRef<WebView>(null);
  const { style, reveal } = useReveal(p.device, p.onReady);
  const onLoad = useInject(ref);
  // Mobile lays out at the panel's own width (a phone width already), so it
  // needs no transform and scrolls natively; Tablet / Desktop render at
  // their real width and are scaled down.
  const vw = p.device === 'mobile' ? p.size.width : VIEWPORT[p.device];
  const scale = p.size.width / vw;
  const frame = { width: vw, height: p.size.height / scale };
  const onMessage = (e: WebViewMessageEvent) => {
    if (e.nativeEvent.data.includes('"as":"ready"')) reveal();
  };
  return (
    <Animated.View
      pointerEvents={p.interactive ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, style]}
    >
      <View
        style={[s.scaled, frame, scale !== 1 && { transform: [{ scale }] }]}
      >
        <WebView
          ref={ref}
          source={{ uri: p.url }}
          style={s.web}
          injectedJavaScript={SCRIPT}
          onLoad={onLoad}
          onMessage={onMessage}
          onContentProcessDidTerminate={p.onGone}
          onRenderProcessGone={p.onGone}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) p.onFail();
          }}
          onError={p.onFail}
          scrollEnabled={p.interactive}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          originWhitelist={['*']}
          // Repeat opens reuse the build's cached (immutable) assets.
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
        />
      </View>
    </Animated.View>
  );
});

type Props = {
  url: string;
  size: Size;
  device: Device;
  interactive: boolean;
  dark: boolean;
  onLive: (live: boolean) => void;
};

/** The mounted viewports (oldest first; the last is the chosen device) and
 *  which of them have painted. */
type Stack = { layers: Device[]; ready: Device[] };

const top = (st: Stack) => st.layers[st.layers.length - 1];

/** A device was picked: keep the one on screen and mount the new one over
 *  it — or, going back to a viewport that is still mounted and painted,
 *  just drop the other. */
function pick(st: Stack, d: Device): Stack {
  if (st.layers.includes(d) && st.ready.includes(d)) {
    return { layers: [d], ready: [d] };
  }
  const keep = [top(st)];
  return {
    layers: [...keep, d],
    ready: st.ready.filter((r) => keep.includes(r)),
  };
}

/** A viewport painted: it is now the only one if it is the chosen one. */
function painted(st: Stack, d: Device): Stack {
  if (!st.layers.includes(d)) return st;
  if (top(st) === d) return { layers: [d], ready: [d] };
  return st.ready.includes(d) ? st : { ...st, ready: [...st.ready, d] };
}

export const LivePreview = React.memo(function LivePreview(p: Props) {
  const { device, onLive } = p;
  const [st, setSt] = React.useState<Stack>({ layers: [device], ready: [] });
  if (top(st) !== device) setSt(pick(st, device));
  const onReady = React.useCallback(
    (d: Device) => {
      onLive(true);
      setSt((prev) => painted(prev, d));
    },
    [onLive]
  );
  React.useEffect(() => () => onLive(false), [onLive]);
  const n = st.layers.length;
  // While a switch loads, the veil sits over the old viewport and UNDER the
  // new one, so the new site's own fade-in is the crossfade; when it has
  // painted the old viewport and the veil go in the same frame.
  return (
    <>
      {st.layers.map((d, k) => (
        <React.Fragment key={d}>
          {k === n - 1 && n > 1 ? <DotVeil dark={p.dark} /> : null}
          <LiveLayer
            url={p.url}
            size={p.size}
            device={d}
            interactive={p.interactive && d === device}
            dark={p.dark}
            onReady={onReady}
          />
        </React.Fragment>
      ))}
    </>
  );
});

const s = StyleSheet.create({
  scaled: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
  },
  web: { flex: 1, backgroundColor: '#FFFFFF' },
  down: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAFAF9',
  },
  downTitle: { fontFamily: F.sans700, fontSize: 16, color: '#0B0B0C' },
  downSub: { fontFamily: F.sans500, fontSize: 13, color: '#5C5D63' },
  retry: {
    marginTop: 10,
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: '#0B0B0C',
  },
  retryText: { fontFamily: F.sans600, fontSize: 14, color: '#FFFFFF' },
  downDark: { backgroundColor: '#141416' },
  inkDark: { color: '#F4F4F5' },
  subDark: { color: 'rgba(244,244,245,0.6)' },
  retryDark: { backgroundColor: '#F4F4F5' },
  retryTextDark: { color: '#0B0B0C' },
});
