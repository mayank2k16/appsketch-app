import * as React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

const DOT_SPACING = 28;
const DOT_SIZE = 4;
/** Resting opacity of one sweep layer. Two layers multiply, so the field sits
 *  at BASE² (~0.12) at rest and hits 1.0 only where both crests coincide. */
const BASE = 0.35;
/** Half-width of a crest, as a fraction of one sweep. */
const CREST = 0.12;
/** The sweep occupies only the middle of the timeline, so every row is back at
 *  BASE at both progress 0 and 1 — that's what makes the loop seamless without
 *  a second animation to cross-fade the restart. */
const SWEEP_START = 0.18;
const SWEEP_SPAN = 0.64;
/** Deliberately coprime-ish durations: the two crests drift in and out of
 *  phase instead of locking, so the pattern never looks like it repeats. */
const SWEEP_DOWN_MS = 2000;
const SWEEP_UP_MS = 3100;

function useSweep(duration: number) {
  const progress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);
  return progress;
}

/**
 * Full-bleed field of dots with two crests sweeping through it in opposite
 * directions, brightening where they cross.
 *
 * Cost is deliberately flat: TWO `Animated.Value`s on the native driver drive
 * the whole field via `interpolate`, so there is no JS work per frame and no
 * per-dot animation. Rows (not dots) are the animated unit — a ~14×25 field is
 * 50 animated nodes, not 350 — and the dots inside each row are plain static
 * Views that never re-render. The two layers are nested rather than combined
 * arithmetically, so compositing multiplies their opacities for free.
 */
export function DotFieldLoader({
  colors,
  label,
}: {
  colors: AppColors;
  label: string;
}) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const down = useSweep(SWEEP_DOWN_MS);
  const up = useSweep(SWEEP_UP_MS);

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height }
    );
  }, []);

  const cols = size.w > 0 ? Math.ceil(size.w / DOT_SPACING) : 0;
  const rows = size.h > 0 ? Math.ceil(size.h / DOT_SPACING) : 0;

  // Rebuilt only when the grid dimensions actually change, never per frame.
  const rowIndices = React.useMemo(
    () => Array.from({ length: rows }, (_, i) => i),
    [rows]
  );
  const colIndices = React.useMemo(
    () => Array.from({ length: cols }, (_, i) => i),
    [cols]
  );

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
      <View style={st.field} pointerEvents="none">
        {rowIndices.map((r) => {
          const frac = rows === 1 ? 0.5 : r / (rows - 1);
          const peakDown = SWEEP_START + SWEEP_SPAN * frac;
          const peakUp = SWEEP_START + SWEEP_SPAN * (1 - frac);

          return (
            <Animated.View
              key={r}
              style={[
                st.row,
                {
                  opacity: down.interpolate({
                    inputRange: [peakDown - CREST, peakDown, peakDown + CREST],
                    outputRange: [BASE, 1, BASE],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Animated.View
                style={[
                  st.rowInner,
                  {
                    opacity: up.interpolate({
                      inputRange: [peakUp - CREST, peakUp, peakUp + CREST],
                      outputRange: [BASE, 1, BASE],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                {colIndices.map((c) => (
                  <View key={c} style={st.cell}>
                    <View style={[st.dot, { backgroundColor: colors.accent }]} />
                  </View>
                ))}
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>

      <View style={[st.labelWrap, { backgroundColor: colors.bg }]} pointerEvents="none">
        <Text style={[st.label, { color: colors.text }]}>{label}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  field: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  row: {
    height: DOT_SPACING,
  },
  rowInner: {
    flexDirection: 'row',
    height: DOT_SPACING,
    alignItems: 'center',
  },
  cell: {
    width: DOT_SPACING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  // Sits on the bg so the dot field doesn't run through the text.
  labelWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  label: {
    fontFamily: F.sans600,
    fontSize: 13.5,
    letterSpacing: 0.2,
  },
});
