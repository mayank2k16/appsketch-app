import LottieView from 'lottie-react-native';
import * as React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';

const { width: W, height: H } = Dimensions.get('window');

/** The native launch screen's colour (app.config.ts): the warm canvas. */
export const SPLASH_CANVAS = '#FAFAF8';
const ACCENT = '#F2600C';
/** assets/lottie/splash-logo.json, made by scripts/make-splash-logo.py: a
 *  480pt comp drawn 1:1 around the screen centre; the finished logo is
 *  168pt; frame 0 is the 16pt launch dot at the centre. 168 frames @60fps. */
const LOTTIE = require('../../../assets/lottie/splash-logo.json');
/** The native launch image, shown until the Lottie has drawn frame 0. */
const SEED = require('../../../assets/splash-dot.png');
const COMP = 480;
const MARK = 168;
const SEED_PT = 16;
const IRIS = Math.ceil(Math.hypot(W, H)) + 8;
const WORD_H = 40;
const TAG_H = 22;
/** The mark rises this far as the wordmark comes up beneath it. */
const LIFT = 44;

/** Milliseconds from the moment the native launch screen is gone. */
export const SPLASH_T = {
  /** The pencil snaps into the logo (frame ~146): one soft haptic. */
  haptic: 2430,
  rise: 2380,
  wordOut: 3420,
  iris: 3500,
  exit: 4040,
} as const;

const out = (duration: number) => ({
  duration,
  easing: Easing.bezier(0.16, 1, 0.3, 1),
});

/** Every shared value of the splash, started together once it is visible. */
function useSplashTimeline(shown: boolean) {
  const lift = useSharedValue(0);
  const word = useSharedValue(0);
  const tag = useSharedValue(0);
  const iris = useSharedValue(1);

  React.useEffect(() => {
    if (!shown) return undefined;
    lift.value = withDelay(SPLASH_T.rise, withTiming(1, out(760)));
    word.value = withDelay(SPLASH_T.rise + 80, withTiming(1, out(720)));
    tag.value = withDelay(SPLASH_T.rise + 200, withTiming(1, out(720)));
    const sink = { duration: 260, easing: Easing.in(Easing.cubic) };
    const t = setTimeout(() => {
      word.value = withTiming(0, sink);
      tag.value = withTiming(0, sink);
      iris.value = withDelay(
        SPLASH_T.iris - SPLASH_T.wordOut,
        withTiming(0, {
          duration: 520,
          easing: Easing.bezier(0.6, 0, 0.8, 0.2),
        })
      );
    }, SPLASH_T.wordOut);
    // One soft haptic as the pencil lands (docs/haptics.md).
    const h = setTimeout(() => haptic.soft(), SPLASH_T.haptic);
    return () => {
      clearTimeout(t);
      clearTimeout(h);
    };
  }, [shown, lift, word, tag, iris]);

  return { lift, word, tag, iris };
}

function useSplashStyles(v: ReturnType<typeof useSplashTimeline>) {
  const { lift, word, tag, iris } = v;
  const irisStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * lift.value }, { scale: iris.value }],
  }));
  // The mark stays whole until the iris edge reaches it, then goes with it.
  const markStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -LIFT * lift.value },
      { scale: Math.min(1, (iris.value * IRIS) / 2 / (MARK * 0.8)) },
    ],
  }));
  const slotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * lift.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: WORD_H * (1 - word.value) }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: TAG_H * (1 - tag.value) }],
  }));
  return { irisStyle, markStyle, slotStyle, wordStyle, tagStyle };
}

type Styles = ReturnType<typeof useSplashStyles>;

/** The launch dot until the Lottie has loaded, then the Lottie, which
 *  starts on that same picture. */
function SplashMark({ shown }: { shown: boolean }) {
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => {
    if (!shown) return undefined;
    // In case a platform never reports the load.
    const t = setTimeout(() => setDrawn(true), 400);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <View style={styles.comp}>
      {shown && (
        <LottieView
          source={LOTTIE}
          autoPlay
          loop={false}
          // Gradient strokes, trims, a mask and a matte at 60fps: the Core
          // Animation engine plays them off the main thread, and lottie-ios
          // falls back to the main-thread engine by itself if it must.
          renderMode="AUTOMATIC"
          onAnimationLoaded={() => setDrawn(true)}
          style={styles.comp}
        />
      )}
      {!drawn && <Image source={SEED} style={styles.seed} />}
    </View>
  );
}

/** "appsketch.ai" (the dot in the accent) and the hero's line, each rising
 *  out of a clipped slot, no fade. */
function Words({ s }: { s: Styles }) {
  return (
    <ReAnimated.View style={[styles.words, s.slotStyle]}>
      <View style={[styles.slot, { height: WORD_H }]}>
        <ReAnimated.Text style={[styles.word, s.wordStyle]}>
          appsketch<Text style={{ color: ACCENT }}>.</Text>ai
        </ReAnimated.Text>
      </View>
      <View style={[styles.slot, { height: TAG_H, marginTop: 4 }]}>
        <ReAnimated.Text style={[styles.tagline, s.tagStyle]}>
          Create unlimited beautiful apps.
        </ReAnimated.Text>
      </View>
    </ReAnimated.View>
  );
}

/**
 * The in-app splash, in both themes. It opens on the native launch screen's
 * exact picture (the warm canvas, the orange dot at the centre); the Lottie
 * draws the logo with its own pencil; the wordmark and tagline rise; then the
 * canvas irises shut into the mark, leaving the theme's own canvas, where the
 * welcome screen (or Home) begins.
 */
export function LogoSplash({ shown }: { shown: boolean }) {
  const s = useSplashStyles(useSplashTimeline(shown));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ReAnimated.View style={[styles.iris, s.irisStyle]} />
      <ReAnimated.View style={[styles.markWrap, s.markStyle]}>
        <SplashMark shown={shown} />
      </ReAnimated.View>
      <Words s={s} />
    </View>
  );
}

const styles = StyleSheet.create({
  iris: {
    position: 'absolute',
    width: IRIS,
    height: IRIS,
    borderRadius: IRIS / 2,
    left: (W - IRIS) / 2,
    top: (H - IRIS) / 2,
    backgroundColor: SPLASH_CANVAS,
  },
  markWrap: {
    position: 'absolute',
    left: (W - COMP) / 2,
    top: (H - COMP) / 2,
    width: COMP,
    height: COMP,
  },
  comp: { width: COMP, height: COMP },
  seed: {
    position: 'absolute',
    left: (COMP - SEED_PT) / 2,
    top: (COMP - SEED_PT) / 2,
    width: SEED_PT,
    height: SEED_PT,
  },
  words: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: H / 2 + MARK / 2 + 22,
  },
  slot: { overflow: 'hidden', alignItems: 'center' },
  word: {
    fontFamily: F.display900,
    fontSize: 32,
    lineHeight: WORD_H,
    letterSpacing: -1,
    color: '#0B0B0C',
  },
  tagline: {
    fontFamily: F.sans500,
    fontSize: 15,
    lineHeight: TAG_H,
    color: '#5C5D63',
  },
});
