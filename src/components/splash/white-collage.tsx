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
 * the network. Four columns of three, read column by column.
 */
const SCREENS = [
  require('../../../assets/splash/zaika.webp'),
  require('../../../assets/splash/pastelpop.webp'),
  require('../../../assets/splash/aurelia.webp'),
  require('../../../assets/splash/voltline.webp'),
  require('../../../assets/splash/kanakam.webp'),
  require('../../../assets/splash/wagwell.webp'),
  require('../../../assets/splash/shelfie.webp'),
  require('../../../assets/splash/yello.webp'),
  require('../../../assets/splash/nimbl.webp'),
  require('../../../assets/splash/basketly.webp'),
  require('../../../assets/splash/keyhaven.webp'),
  require('../../../assets/splash/smashyard.webp'),
];

const COLS = 4;
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
  source,
  start,
  clock,
  tone,
}: {
  source: number;
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
    <ReAnimated.View style={[styles.tile, TILE_TONE[tone], style]}>
      <ExpoImage
        source={source}
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
      {SCREENS.slice(col * ROWS, col * ROWS + ROWS).map((src, row) => (
        <Tile
          key={row}
          source={src}
          // The lowest (most visible) tiles arrive first, sweeping across.
          start={(ROWS - 1 - row) * 90 + col * 70}
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
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  img: { width: '100%', height: '100%' },
});
