import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';

import { Rim } from './rim';
import { Shot, SHOT_RATIO, type ShotFit } from './shot';

/**
 * The appsketch.ai landing-page iPhone, in RN. Every length is proportional
 * to the frame width (u = width / 300), so the frame looks identical at any
 * tile size: metal rim (0.9%) → black glass bezel (2.3%, 3.21% in all) → white screen with a status bar
 * (9:41, dynamic island, signal, battery), the screenshot below it, and the
 * home indicator over the bottom of the shot.
 */

const INK = '#0b0b0c';
const GLASS = '#0a0a0b';
const SIGNAL = [0.35, 0.55, 0.78, 1] as const;

/** Style objects per width, built once — the reel only ever has one or two
 *  phone widths, so this never grows and no tile allocates styles. */
const cache = new Map<number, ReturnType<typeof build>>();

/** Rim, glass, screen, island and home indicator. */
function buildBody(w: number) {
  const u = w / 300;
  return {
    rim: {
      width: w,
      height: (w * 812) / 390,
      borderRadius: w * 0.155,
      padding: w * 0.0091,
    },
    glass: {
      flex: 1,
      backgroundColor: GLASS,
      borderRadius: w * 0.148,
      padding: w * 0.023,
    },
    screen: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: w * 0.134,
      overflow: 'hidden',
      borderCurve: 'continuous',
    },
    status: {
      height: 40 * u,
      backgroundColor: '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 32 * u,
      paddingRight: 26 * u,
    },
    island: {
      position: 'absolute',
      top: 9 * u,
      alignSelf: 'center',
      width: 88 * u,
      height: 26 * u,
      borderRadius: 13 * u,
      backgroundColor: '#000',
    },
    home: {
      position: 'absolute',
      bottom: 7 * u,
      alignSelf: 'center',
      width: 112 * u,
      height: 4.5 * u,
      borderRadius: 2.25 * u,
      backgroundColor: INK,
    },
  } as const;
}

/** The status bar's glyphs: time, signal, battery. */
function buildStatus(w: number) {
  const u = w / 300;
  return {
    time: {
      fontFamily: F.sans600,
      fontSize: 12.5 * u,
      color: INK,
      flex: 1,
      includeFontPadding: false,
    },
    right: { flexDirection: 'row', alignItems: 'center', gap: 5 * u },
    signal: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 10 * u,
      gap: 1.4 * u,
    },
    bar: { width: 2.6 * u, borderRadius: 0.8 * u, backgroundColor: INK },
    battery: {
      width: 20 * u,
      height: 10 * u,
      borderWidth: 1,
      borderColor: 'rgba(11,11,12,.45)',
      borderRadius: 3 * u,
      padding: 1.2 * u,
    },
    charge: { flex: 1, backgroundColor: INK, borderRadius: 1.6 * u },
    unitH: { height: 10 * u },
  } as const;
}

function build(w: number) {
  return StyleSheet.create({ ...buildBody(w), ...buildStatus(w) });
}

export function phoneStyles(w: number) {
  let st = cache.get(w);
  if (!st) {
    st = build(w);
    cache.set(w, st);
  }
  return st;
}

const StatusBar = React.memo(function StatusBar({ w }: { w: number }) {
  const st = phoneStyles(w);
  const unit = st.unitH.height;
  return (
    <View style={st.status}>
      <Text style={st.time} allowFontScaling={false}>
        9:41
      </Text>
      <View style={st.right}>
        <View style={st.signal}>
          {SIGNAL.map((f) => (
            <View key={f} style={[st.bar, { height: unit * f }]} />
          ))}
        </View>
        <View style={st.battery}>
          <View style={st.charge} />
        </View>
      </View>
    </View>
  );
});

type PhoneProps = { uri: string; w: number; dark: boolean };

const fits = new Map<number, ShotFit>();

/** The screen under the status bar, for the screenshot's decode size. */
function screenFit(w: number): ShotFit {
  let f = fits.get(w);
  if (!f) {
    const inset = w * 0.0091 * 2 + w * 0.023 * 2;
    const h = (w * 812) / 390 - inset - (40 * w) / 300;
    f = { w: w - inset, h, ratio: SHOT_RATIO.app };
    fits.set(w, f);
  }
  return f;
}

export const PhoneFrame = React.memo(function PhoneFrame({
  uri,
  w,
  dark,
}: PhoneProps) {
  const st = phoneStyles(w);
  return (
    <Rim dark={dark} style={st.rim}>
      <View style={st.glass}>
        <View style={st.screen}>
          <StatusBar w={w} />
          <Shot uri={uri} fit={screenFit(w)} />
          <View style={st.home} />
          <View style={st.island} />
        </View>
      </View>
    </Rim>
  );
});
