import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import ReAnimated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

/**
 * Real AppSketch template screens, bundled so the first launch never waits on
 * the network, column by column. Most carry their app's own accent, drawn
 * as the tile's border stripe. The tilt lifts the right of the collage, so
 * the first and third columns end early and get a fourth screen (plain
 * hairline, no accent) to fill the space down to the brand, faded out above
 * it by the welcome screen.
 */
type Screen = { src: number; accent?: string };
const S = (src: number, accent?: string): Screen => ({ src, accent });

const COLUMNS: readonly (readonly Screen[])[] = [
  [
    S(require('../../../assets/splash/zaika.webp'), '#C2582F'),
    S(require('../../../assets/splash/pastelpop.webp'), '#A3C93A'),
    S(require('../../../assets/splash/aurelia.webp'), '#3DA4FB'),
    S(require('../../../assets/splash/bloomstead.webp')),
  ],
  [
    S(require('../../../assets/splash/voltline.webp'), '#7A4BF7'),
    S(require('../../../assets/splash/kanakam.webp'), '#B8892E'),
    S(require('../../../assets/splash/wagwell.webp'), '#F0B91F'),
  ],
  [
    S(require('../../../assets/splash/shelfie.webp'), '#E51D8A'),
    S(require('../../../assets/splash/yello.webp'), '#E8B90F'),
    S(require('../../../assets/splash/nimbl.webp'), '#356EE8'),
    S(require('../../../assets/splash/napoletto.webp')),
  ],
  [
    S(require('../../../assets/splash/basketly.webp'), '#7A2E7E'),
    S(require('../../../assets/splash/keyhaven.webp'), '#197F65'),
    S(require('../../../assets/splash/smashyard.webp'), '#E2681E'),
  ],
];

const COLS = 4;
/** The frame's height is three rows; a fourth tile hangs below it. */
const ROWS = 3;
const GAP = 12;
export const TILE_W = Math.round(width * 0.3);
const TILE_H = Math.round(TILE_W * 1.86);
const COL_H = ROWS * TILE_H + (ROWS - 1) * GAP;
const ROW_W = COLS * TILE_W + (COLS - 1) * GAP;
/** Where the column bottoms sit (before the tilt), as a share of the screen. */
export const COLLAGE_BOTTOM = Math.round(height * 0.49);
/** How far the tilted, drifting columns can reach below `bottom`: keep the
 *  next block at least this far down. */
export const COLLAGE_OVERHANG = 60;
/** Static stagger per column, like the reference's offset columns. */
const STAGGER = [-18, 10, -34, 4];
/** Neighbouring columns drift in opposite directions along the tilt. */
const DRIFT_DIR = [-1, 1, -1, 1];
const DRIFT_PX = 30;

/** The splash clock runs 0 → CLOCK_MS, linearly, on the UI thread. */
export const CLOCK_MS = 3000;
const FADE_MS = 520;

const TILE_TONE = {
  light: { backgroundColor: '#F4F4F2', borderColor: '#E7E7E4' },
  dark: { backgroundColor: '#16161A', borderColor: 'rgba(255,255,255,0.08)' },
};
type Tone = keyof typeof TILE_TONE;

function Tile({
  screen,
  start,
  clock,
  tone,
}: {
  screen: Screen;
  start: number;
  clock: SharedValue<number>;
  tone: Tone;
}) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (clock.value - start) / FADE_MS));
    const e = 1 - (1 - p) * (1 - p) * (1 - p);
    return { opacity: e, transform: [{ scale: 0.92 + 0.08 * e }] };
  });
  return (
    <ReAnimated.View
      style={[
        styles.tile,
        TILE_TONE[tone],
        screen.accent
          ? { borderColor: screen.accent, borderWidth: 2 }
          : styles.plain,
        style,
      ]}
    >
      <ExpoImage
        source={screen.src}
        style={styles.img}
        contentFit="cover"
        contentPosition="top"
        priority="high"
        transition={0}
      />
    </ReAnimated.View>
  );
}

function Column({
  col,
  clock,
  tone,
}: {
  col: number;
  clock: SharedValue<number>;
  tone: Tone;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          STAGGER[col] + DRIFT_DIR[col] * DRIFT_PX * (clock.value / CLOCK_MS),
      },
    ],
  }));
  return (
    <ReAnimated.View style={[styles.column, style]}>
      {COLUMNS[col].map((screen, row) => (
        <Tile
          key={row}
          screen={screen}
          // The lowest (most visible) tiles arrive first, sweeping across.
          start={Math.max(0, ROWS - 1 - row) * 90 + col * 70}
          clock={clock}
          tone={tone}
        />
      ))}
    </ReAnimated.View>
  );
}

/**
 * The top of the welcome screen: a tilted collage of template screens in
 * staggered columns, bleeding off the top and sides. Every tile fades and
 * settles in from one shared clock while the columns drift. `bottom` is the
 * screen y where the columns end (before the tilt).
 */
export function WhiteCollage({
  clock,
  bottom = COLLAGE_BOTTOM,
  dark = false,
}: {
  clock: SharedValue<number>;
  bottom?: number;
  dark?: boolean;
}) {
  const tone: Tone = dark ? 'dark' : 'light';
  return (
    <View pointerEvents="none" style={[styles.frame, { top: bottom - COL_H }]}>
      {Array.from({ length: COLS }, (_, col) => (
        <Column key={col} col={col} clock={clock} tone={tone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    width: ROW_W,
    height: COL_H,
    left: (width - ROW_W) / 2,
    flexDirection: 'row',
    gap: GAP,
    transform: [{ rotate: '-12deg' }],
  },
  column: { width: TILE_W, gap: GAP },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  plain: { borderWidth: StyleSheet.hairlineWidth },
  img: { width: '100%', height: '100%' },
});
