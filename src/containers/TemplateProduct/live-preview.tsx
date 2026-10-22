import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  autoScrollScript,
  FIT_SCRIPT,
  pauseAutoScroll,
  READY_SCRIPT,
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
 * taps work (links, menus; navigation stays inside the WebView). The
 * auto-scroll stops for good on the first touch. The scale transform maps
 * touches back to the right element at Tablet / Desktop widths too.
 *
 * The WebView renders at the device's real CSS width (390 / 820 / 1280) and
 * is scaled to the hero's width with a transform, so the site lays itself
 * out exactly as on that device, fitted to the panel's inside (its border
 * excluded) so a 1280px Desktop page is never clipped. Switching device
 * mounts the new width on top at once; until it has painted, the old one
 * stays under a frosted veil with the orange dot ripple (dot-loader.tsx),
 * then the new one fades in over both (~200ms) and the old one is dropped.
 */

/** Page px/s at phone width — about 20pt/s on screen. */
const SPEED = 40;
/** The loader → site crossfade. */
const FADE_MS = 200;

const SCRIPT = FIT_SCRIPT + autoScrollScript(SPEED, true) + READY_SCRIPT;

type Size = { width: number; height: number };

type LayerProps = {
  url: string;
  size: Size;
  device: Device;
  /** Auto-scroll may run (centred page, screen focused, app foreground). */
  active: boolean;
  /** Takes touches (the centred page). */
  interactive: boolean;
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

const LiveLayer = React.memo(function LiveLayer(p: LayerProps) {
  const ref = React.useRef<WebView>(null);
  const { style, reveal } = useReveal(p.device, p.onReady);
  React.useEffect(() => {
    ref.current?.injectJavaScript(pauseAutoScroll(p.active));
  }, [p.active]);
  const vw = VIEWPORT[p.device];
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
      <View style={[s.scaled, frame, { transform: [{ scale }] }]}>
        <WebView
          ref={ref}
          source={{ uri: p.url }}
          style={s.web}
          injectedJavaScript={SCRIPT}
          // iOS can skip `injectedJavaScript`, so it is also injected on
          // load; both scripts install once per document.
          onLoad={() => ref.current?.injectJavaScript(SCRIPT)}
          onMessage={onMessage}
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
  active: boolean;
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
            active={p.active}
            interactive={p.interactive && d === device}
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
});
