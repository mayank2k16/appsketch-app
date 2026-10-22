import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import {
  autoScrollScript,
  READY_SCRIPT,
} from '../../TemplateProduct/autoscroll-script';

/**
 * A real build, live, inside a studio card. The card variant of the product
 * page's LivePreview: rendered at a desktop viewport (the same 1280px the
 * 16:10 screenshot was captured at) and scaled by `width / 1280` about its
 * TOP-LEFT corner, so the site's full width shows, its top at the top of
 * the sheet, and it lines up with the screenshot under it (no jump on the
 * crossfade). It never takes touches — the card's tap opens the product
 * page — and it scrolls itself (autoscroll-script) at a slow, readable
 * pace. It fades in over the screenshot once the page says it has painted
 * (READY_SCRIPT, which also hides the web-runner's "Made with" badge), or a
 * beat after `load` at the latest, so there is never a blank frame.
 */

const VIEWPORT = 1280;
/** Page px/s — ~12pt/s at card scale. */
const SPEED = 70;
/** Fallback reveal after `load`, if the page never says it is ready. */
const SETTLE_MS = 700;

type Props = {
  url: string;
  width: number;
  height: number;
  onLive: (live: boolean) => void;
};

/** Fades the site in once (the first of "ready" / the load fallback). */
function useReveal(shown: SharedValue<number>, onLive: (on: boolean) => void) {
  const revealed = React.useRef(false);
  React.useEffect(
    () => () => {
      revealed.current = true; // unmounted: a pending reveal is void
      onLive(false);
    },
    [onLive]
  );
  return React.useCallback(
    (delay: number) => {
      if (revealed.current) return;
      revealed.current = true;
      shown.set(withDelay(delay, withTiming(1, { duration: 260 })));
      onLive(true);
    },
    [shown, onLive]
  );
}

export const LiveSite = React.memo(function LiveSite({
  url,
  width,
  height,
  onLive,
}: Props) {
  const ref = React.useRef<WebView>(null);
  const shown = useSharedValue(0);
  const fade = useAnimatedStyle(() => ({ opacity: shown.value }));

  const scale = width / VIEWPORT;
  const frame = React.useMemo(
    () => ({
      width: VIEWPORT,
      height: height / scale,
      transform: [{ scale }],
    }),
    [height, scale]
  );
  const script = React.useMemo(
    () => autoScrollScript(SPEED) + READY_SCRIPT,
    []
  );
  const reveal = useReveal(shown, onLive);
  const onLoad = React.useCallback(() => {
    // iOS can skip `injectedJavaScript`; the script installs once.
    ref.current?.injectJavaScript(script);
    setTimeout(() => reveal(0), SETTLE_MS);
  }, [script, reveal]);
  const onMessage = React.useCallback(
    (e: { nativeEvent: { data: string } }) => {
      if (e.nativeEvent.data.includes('"as":"ready"')) reveal(120);
    },
    [reveal]
  );

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
      <View style={[s.scaled, frame]}>
        <WebView
          ref={ref}
          source={{ uri: url }}
          style={s.web}
          injectedJavaScript={script}
          onMessage={onMessage}
          onLoad={onLoad}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          textInteractionEnabled={false}
          originWhitelist={['*']}
        />
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  scaled: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
    backgroundColor: '#FFFFFF',
  },
  web: { flex: 1, backgroundColor: '#FFFFFF' },
});
