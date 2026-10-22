import { useIsFocused } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

// Every dot on screen twinkles, exactly as before — but the field is painted
// as three tiled SVG layers instead of one animated view per dot.
//
// The old version created an Animated.Value and an Animated.View per grid
// cell, and `density` defaulted to 1: on a 390×844 screen at 31px spacing
// that is 406 live animation drivers and 406 animated views running
// permanently behind every section of the Home feed. It was the single
// largest source of scroll jank.
//
// Each layer is ONE <Svg> whose pattern tile spans a 3×3 block of cells and
// paints 3 of the 9 cells in that block. The three layers' cell positions form
// a Latin square, so together they cover all 9 — i.e. every dot in the grid
// belongs to exactly one layer. Animating each layer's opacity therefore
// twinkles the whole field, scattered rather than in lockstep, at a cost of
// three animation drivers and three SVG nodes.
const LAYERS: [number, number][][] = [
  [
    [0, 0],
    [1, 2],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 2],
    [0, 1],
  ],
  [
    [2, 0],
    [0, 2],
    [1, 1],
  ],
];
const BLOCK = 3;

/** Gap from the screen edge to the edge of the outermost dot, on all four sides. */
const EDGE_MARGIN = 8;

/**
 * Where a dot sits inside its own cell: the middle, never the corner.
 *
 * An SVG `<Pattern>` CLIPS its contents to the tile. Dots used to be drawn at
 * `cell * step`, which puts the cell-0 dots exactly on the tile's edge — so
 * those rendered as quarter-discs while the interior ones rendered whole. That
 * is why the field looked like a mix of big and small dots: they were all the
 * same radius, but three quarters of some of them were being cut off.
 *
 * Centring every dot in its cell keeps the whole circle inside the tile, so
 * all of them draw identically.
 */
const cellCentre = (cell: number, step: number) => cell * step + step / 2;

/**
 * Pitch and pattern origin that pin the outer dots `EDGE_MARGIN` from the edge.
 *
 * `spacing` is a target, not a hard pitch: a whole number of columns almost
 * never divides the screen exactly, and the leftover used to pile up on one
 * side. Rather than split the remainder (which leaves the margin at whatever
 * the screen width happens to make it), the remainder is spread across the
 * gaps — the pitch stretches or shrinks by under a pixel, and the first and
 * last columns land exactly 8px from their edges.
 *
 * `origin` is where the pattern tile starts. It backs off by half a step
 * because `cellCentre` draws the dot in the middle of its cell, not at 0.
 */
const gridMetrics = (extent: number, spacing: number, radius: number) => {
  // Distance between the first and last dot CENTRES.
  const span = extent - 2 * (EDGE_MARGIN + radius);
  const gaps = Math.max(1, Math.round(span / spacing));
  const step = span / gaps;
  return { step, origin: EDGE_MARGIN + radius - step / 2 };
};

type Props = {
  width: number;
  height: number;
  color: string;
  spacing?: number;
  radius?: number;
  /** opacity of the constant background grid */
  baseOpacity?: number;
  /** brightest opacity a twinkling dot reaches */
  peakOpacity?: number;
  /** Lay the grid out as if the field were this tall (default `height`), so
   *  a field cut shorter keeps exactly the same dot positions. */
  gridHeight?: number;
  /** False while the field is off screen: the twinkle freezes in place. */
  live?: boolean;
};

/** One layer's opacity, base → peak and back, frozen while not `live`. */
function useTwinkle(index: number, live: boolean, [lo, hi]: [number, number]) {
  const v = useSharedValue(0);

  React.useEffect(() => {
    if (!live) {
      cancelAnimation(v);
      return;
    }
    // Staggered durations and delays keep the three layers permanently out of
    // phase, so the field shimmers instead of pulsing as one sheet.
    v.value = withDelay(
      index * 900,
      withRepeat(
        withTiming(1, {
          duration: 1900 + index * 650,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    return () => cancelAnimation(v);
  }, [v, index, live]);

  return useAnimatedStyle(() => ({
    opacity: lo + (hi - lo) * v.value,
  }));
}

function TwinkleLayer({
  index,
  cells,
  width,
  height,
  spacing,
  radius,
  color,
  baseOpacity,
  peakOpacity,
  gridHeight,
  live,
}: {
  index: number;
  cells: [number, number][];
  width: number;
  height: number;
  spacing: number;
  radius: number;
  color: string;
  baseOpacity: number;
  peakOpacity: number;
  gridHeight: number;
  live: boolean;
}) {
  const style = useTwinkle(index, live, [baseOpacity, peakOpacity]);

  const { step, origin: originX } = gridMetrics(width, spacing, radius);
  const { origin: originY } = gridMetrics(gridHeight, spacing, radius);
  const tile = step * BLOCK;
  const id = `twinkleLayer${index}`;

  return (
    <Reanimated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id={id}
            x={originX}
            y={originY}
            width={tile}
            height={tile}
            patternUnits="userSpaceOnUse"
          >
            {cells.map(([cx, cy]) => (
              <Circle
                key={`${cx}-${cy}`}
                cx={cellCentre(cx, step)}
                cy={cellCentre(cy, step)}
                r={radius}
                fill={color}
              />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
      </Svg>
    </Reanimated.View>
  );
}

/**
 * The field is the three twinkle layers alone. There used to be a fourth,
 * constant base grid under them (every dot at `baseOpacity`), but each dot
 * sits in exactly one layer, so base-under-layer is the same as that layer
 * alone with its opacity remapped: 1 - (1 - base)(1 - a) is linear in a,
 * running from 1 - (1 - base)² to 1 - (1 - base)(1 - peak). Same pixels,
 * one full-size layer fewer (Home's white dots were 16 per colour band).
 * The layers stay mounted when Home is blurred or the field is off screen —
 * they freeze — so coming back never re-draws them.
 */
export function TwinkleDots({
  width,
  height,
  color,
  spacing = 34,
  radius = 1.4,
  baseOpacity = 0.6,
  peakOpacity = 0.9,
  gridHeight = height,
  live = true,
}: Props) {
  const isFocused = useIsFocused();
  const lo = 1 - (1 - baseOpacity) ** 2;
  const hi = 1 - (1 - baseOpacity) * (1 - peakOpacity);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {LAYERS.map((cells, i) => (
        <TwinkleLayer
          key={i}
          index={i}
          cells={cells}
          width={width}
          height={height}
          spacing={spacing}
          radius={radius}
          color={color}
          baseOpacity={lo}
          peakOpacity={hi}
          gridHeight={gridHeight}
          live={live && isFocused}
        />
      ))}
    </View>
  );
}
