import { useIsFocused } from '@react-navigation/native';
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
};

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
}) {
  const v = useSharedValue(0);

  React.useEffect(() => {
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
  }, [v, index]);

  const style = useAnimatedStyle(() => ({
    opacity: baseOpacity + (peakOpacity - baseOpacity) * v.value,
  }));

  const { step, origin: originX } = gridMetrics(width, spacing, radius);
  const { origin: originY } = gridMetrics(height, spacing, radius);
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

export function TwinkleDots({
  width,
  height,
  color,
  spacing = 34,
  radius = 1.4,
  baseOpacity = 0.6,
  peakOpacity = 0.9,
}: Props) {
  const isFocused = useIsFocused();
  const { step, origin: originX } = gridMetrics(width, spacing, radius);
  const { origin: originY } = gridMetrics(height, spacing, radius);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Constant base grid — holds the full dot field at rest, and is all
          that remains when the screen is not focused. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="twinkleGrid"
            x={originX}
            y={originY}
            width={step}
            height={step}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={cellCentre(0, step)}
              cy={cellCentre(0, step)}
              r={radius}
              fill={color}
              opacity={baseOpacity}
            />
          </Pattern>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#twinkleGrid)"
        />
      </Svg>

      {/* Animations stop entirely when Home is not the focused screen */}
      {isFocused &&
        LAYERS.map((cells, i) => (
          <TwinkleLayer
            key={i}
            index={i}
            cells={cells}
            width={width}
            height={height}
            spacing={spacing}
            radius={radius}
            color={color}
            baseOpacity={baseOpacity}
            peakOpacity={peakOpacity}
          />
        ))}
    </View>
  );
}
