import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { useOnScreen } from '../on-screen';
import { thumbOf } from '../TemplateReel/layout';
import { Shot } from '../TemplateReel/shot';
import { su } from './geometry';
import type { Story } from './stories';

/**
 * A story card's art, after the App Store's "Happening now" card: three
 * template screenshots on off-white paper sheets, tilted and overlapping
 * edge to edge, on a near-black top that deepens into the card's vivid
 * tint; the sheets' lower part melts into that tint, and a few sparkles sit
 * top-right. Static images only (never a live site). One gentle motion: the
 * sheets float a few points on the UI thread, only while Home is focused
 * and the showcase is on screen.
 *
 * Coordinates are the art's own (its origin is just inside the card's
 * border), measured off the App Store card at the same width.
 */

const FLOAT_MS = 3600;

function useFloat() {
  // Only while Home is focused AND the showcase is on screen.
  const focused = useIsFocused();
  const shown = useOnScreen('showcase');
  const on = focused && shown;
  const p = useSharedValue(0);
  React.useEffect(() => {
    if (!on) {
      cancelAnimation(p);
      return;
    }
    p.set(
      withRepeat(
        withTiming(1, { duration: FLOAT_MS, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    return () => cancelAnimation(p);
  }, [on, p]);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: 2 - p.value * 4 }],
  }));
}

type Sheet = { x: number; y: number; w: number; h: number; r: string };

/** Left (behind), centre (the lead), right (in front) — like the
 *  reference, whose right sheet overlaps the centre one. */
const SHEETS: readonly Sheet[] = [
  { x: 40, y: 52, w: 120, h: 156, r: '9deg' },
  { x: 102, y: 50, w: 128, h: 184, r: '-7deg' },
  { x: 212, y: 80, w: 98, h: 134, r: '10deg' },
].map((sh) => ({
  ...sh,
  x: su(sh.x),
  y: su(sh.y),
  w: su(sh.w),
  h: su(sh.h),
}));
const PAPER = '#F3F0E6';

function Sheets({ story }: { story: Story }) {
  // art[0] is the lead: it goes in the middle.
  const order = [story.art[1], story.art[0], story.art[2]];
  return (
    <>
      {SHEETS.map((sh, k) => {
        const t = order[k] ?? story.art[0];
        return (
          <View
            key={k}
            style={[
              s.sheet,
              {
                left: sh.x,
                top: sh.y,
                width: sh.w,
                height: sh.h,
                transform: [{ rotate: sh.r }],
              },
            ]}
          >
            <View style={s.print}>
              <Shot uri={thumbOf(t)} bg={PAPER} />
            </View>
          </View>
        );
      })}
    </>
  );
}

/** A soft four-point star of radius r centred on (cx, cy). */
const star = (cx: number, cy: number, r: number) => {
  const k = r * 0.28;
  return (
    `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} ` +
    `Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} ` +
    `Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`
  );
};

const SPARKS_W = 70;
const SPARKS_H = 80;
const SPARKS_K = su(100) / 100;

/** White dots plus two accents (a coral star, a mint dot, a pink star),
 *  top-right, as on the reference. */
const Sparkles = React.memo(function Sparkles() {
  return (
    <Svg
      width={SPARKS_W * SPARKS_K}
      height={SPARKS_H * SPARKS_K}
      viewBox={`0 0 ${SPARKS_W} ${SPARKS_H}`}
      style={s.sparks}
    >
      <Ellipse cx={25.5} cy={2.5} rx={1.6} ry={1.6} fill="#FFFFFF" />
      <Ellipse cx={65.5} cy={3.5} rx={1.8} ry={1.8} fill="#FFFFFF" />
      <Ellipse cx={49.5} cy={19.5} rx={1.3} ry={1.3} fill="#FFFFFF" />
      <Ellipse cx={57.5} cy={38.5} rx={1.5} ry={1.5} fill="#FFFFFF" />
      <Path d={star(46.5, 32.5, 8)} fill="#F2414E" />
      <Ellipse cx={34.5} cy={61.5} rx={5} ry={3.4} fill="#25CFA8" />
      <Path d={star(57.5, 57.5, 5)} fill="#F7A8C6" />
    </Svg>
  );
});

export const StoryArt = React.memo(function StoryArt({
  story,
}: {
  story: Story;
}) {
  const float = useFloat();
  const { tint } = story;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[tint.deep, tint.deep, tint.edge]}
        locations={[0, 0.46, 0.72]}
        start={{ x: 0.62, y: 0 }}
        end={{ x: 0.38, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, float]}>
        <Sheets story={story} />
      </Animated.View>
      <Sparkles />
      <LinearGradient
        colors={[`${tint.edge}00`, `${tint.edge}B3`, tint.edge, tint.edge]}
        locations={[0, 0.24, 0.4, 1]}
        style={s.fade}
        pointerEvents="none"
      />
    </View>
  );
});

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    padding: su(7),
    borderRadius: 3,
    backgroundColor: PAPER,
  },
  print: { flex: 1, overflow: 'hidden' },
  sparks: { position: 'absolute', top: su(40), right: su(22) },
  // Down to the art's bottom, so the text sits on the flat vivid tint and
  // the art's edges vanish into the border.
  fade: { position: 'absolute', left: 0, right: 0, top: su(176), bottom: 0 },
});
