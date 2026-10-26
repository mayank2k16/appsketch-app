import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { F } from '@/lib/fonts';

import { type EtaKind, expectedMs, progressOf, recordMs } from './estimates';

/**
 * A load's progress with its ETA, drawn on the canvas being loaded: what is
 * loading, an orange bar, "About 6s left" and the percentage. The ETA is
 * this phone's own learned time for that kind of load (estimates.ts); once
 * it runs past, the line says "Almost there…" instead of counting below
 * zero. When `done` turns true the bar fills and the real duration is
 * recorded, so the next ETA is closer.
 */

const ORANGE = '#F2600C';
const TICK_MS = 250;

type Props = {
  kind: EtaKind;
  label: string;
  dark: boolean;
  /** The load finished: fill the bar and learn from it. */
  done?: boolean;
};

function useElapsed(done: boolean) {
  const start = React.useRef(Date.now());
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (done) return;
    const id = setInterval(
      () => setElapsed(Date.now() - start.current),
      TICK_MS
    );
    return () => clearInterval(id);
  }, [done]);
  return { elapsed, start };
}

export const EtaLoader = React.memo(function EtaLoader({
  kind,
  label,
  dark,
  done = false,
}: Props) {
  const [expected] = React.useState(() => expectedMs(kind));
  const { elapsed, start } = useElapsed(done);
  const recorded = React.useRef(false);
  React.useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    recordMs(kind, Date.now() - start.current);
  }, [done, kind, start]);
  const { p, leftS } = progressOf(elapsed, expected);
  const fill = useSharedValue(0);
  React.useEffect(() => {
    fill.value = withTiming(done ? 1 : p, {
      duration: done ? 180 : TICK_MS,
      easing: Easing.linear,
    });
  }, [p, done, fill]);
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const ink = dark ? '#FFFFFF' : '#0B0B0C';
  const muted = dark ? 'rgba(255,255,255,0.62)' : 'rgba(11,11,12,0.55)';
  const eta = done
    ? 'Ready'
    : leftS > 0
      ? `About ${leftS}s left`
      : 'Almost there…';
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}. ${eta}`}
      style={[s.card, dark ? s.cardDark : s.cardLight]}
    >
      <Text numberOfLines={1} style={[s.label, { color: ink }]}>
        {label}
      </Text>
      <View style={[s.track, dark ? s.trackDark : s.trackLight]}>
        <Animated.View style={[s.fill, bar]} />
      </View>
      <View style={s.row}>
        <Text style={[s.meta, { color: muted }]}>{eta}</Text>
        <Text style={[s.meta, s.pct, { color: muted }]}>
          {`${Math.round((done ? 1 : p) * 100)}%`}
        </Text>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    width: 232,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  cardLight: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardDark: {
    backgroundColor: 'rgba(20,20,22,0.92)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  label: { fontFamily: F.sans700, fontSize: 13.5, letterSpacing: -0.1 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  trackLight: { backgroundColor: 'rgba(242,96,12,0.14)' },
  trackDark: { backgroundColor: 'rgba(242,96,12,0.22)' },
  fill: { height: 4, borderRadius: 2, backgroundColor: ORANGE },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: F.sans600, fontSize: 11.5 },
  pct: { fontVariant: ['tabular-nums'] },
});
