import * as React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { TileRect } from '@/lib/template-transition';

import { DotSurface } from './dot-loader';
import { HERO_RADIUS } from './geometry';
import { LiveLoader } from './live-loader';
import type { ProductMotion } from './use-product-transition';

/**
 * The tile in flight: the page shows no screenshots, so what grows from the
 * tapped tile's rect (with its ~10pt corners) onto the hero is the hero's
 * own resting surface — the dot surface for a website, the flowing
 * gradient for an app — fading up
 * over the tile as it leaves. Once `landed` flips it hides in the same
 * frame the hero shows the identical surface, so the hand-over cannot be
 * seen; the live site then fades in on the hero. On close it reappears
 * there (following a pull-down, if any) and flies back onto the tile.
 */

const TILE_RADIUS = 10;

type Props = {
  seed: string;
  dark: boolean;
  /** A website: fly the dot surface its hero rests on, not the gradient. */
  dots: boolean;
  rect: TileRect;
  to: TileRect;
  m: ProductMotion;
};

export const GrowOverlay = React.memo(function GrowOverlay({
  seed,
  dark,
  dots,
  rect,
  to,
  m,
}: Props) {
  const style = useAnimatedStyle(() => {
    const p = m.grow.value;
    const lerp = (a: number, b: number) => a + (b - a) * p;
    return {
      opacity: m.landed.value ? 0 : Math.min(1, p * 4),
      left: lerp(rect.x, to.x),
      top: lerp(rect.y, to.y),
      width: Math.max(1, lerp(rect.width, to.width)),
      height: Math.max(1, lerp(rect.height, to.height)),
      borderRadius: lerp(TILE_RADIUS, HERO_RADIUS),
      transform: [{ translateY: m.drag.value }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[s.fly, style]}>
      {dots ? (
        <DotSurface dark={dark} animate={false} />
      ) : (
        <LiveLoader seed={seed} dark={dark} animate={false} />
      )}
    </Animated.View>
  );
});

const s = StyleSheet.create({
  fly: {
    position: 'absolute',
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
});
