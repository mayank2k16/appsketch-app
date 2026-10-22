import { Image } from 'expo-image';
import * as React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { thumbOf } from '@/containers/Home/TemplateReel/layout';

import { CheapGradient, paletteOf } from './live-loader';

/**
 * The page's frosted backdrop: the centred template's own screenshot,
 * scaled to cover the screen and heavily blurred, under a light frosted wash.
 * The panels are opaque, so it only shows in the gaps around and between
 * them (gutters, the strip above the hero, the control bar, under the box) —
 * soft colour taken from the template, like iOS frosted glass.
 *
 * Each page in the ±1 window has a layer whose opacity follows the pager
 * position on the UI thread (no per-frame JS), so the gaps crossfade to the
 * next template's colours as you swipe. A template without a screenshot
 * gets its loader palette as a soft gradient instead.
 */

/** The backdrop is drawn at 1/SHRINK of the screen and scaled back up: it
 *  is heavily blurred anyway, so a tiny decode (≈150px wide instead of the
 *  780 × 1688 screenshot), blurred to the same on-screen radius, looks the same once the
 *  GPU magnifies it — and decoding + blurring it is ~60× less work (the
 *  blur transformer used to run on the full-size image for every page). */
const SHRINK = 8;
/** Matches the old full-size `blurRadius` 60 on screen (measured side by
 *  side): the small image is magnified ~1.6× more than the 780px one was. */
const BLUR = 12;
const WASH = { light: 'rgba(255,255,255,0.3)', dark: 'rgba(0,0,0,0.38)' };

type LayerProps = {
  template: MarketTemplate;
  i: number;
  x: SharedValue<number>;
  /** The small canvas, scaled up by SHRINK to cover the screen. */
  small: { width: number; height: number };
};

const Layer = React.memo(function Layer({ template, i, x, small }: LayerProps) {
  const fade = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(i - x.value)),
  }));
  const uri = thumbOf(template);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, fade]}>
      {uri ? (
        <Image
          source={{ uri }}
          blurRadius={BLUR}
          contentFit="cover"
          cachePolicy="memory-disk"
          allowDownscaling
          enforceEarlyResizing
          transition={0}
          style={[s.small, small]}
        />
      ) : (
        <CheapGradient
          colors={paletteOf(template.key)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          width={small.width * SHRINK}
          height={small.height * SHRINK}
        />
      )}
    </Animated.View>
  );
});

type Props = {
  pages: readonly { template: MarketTemplate; i: number }[];
  x: SharedValue<number>;
  dark: boolean;
  /** Under everything, while a screenshot decodes. */
  base: string;
};

export function PageBackdrop({ pages, x, dark, base }: Props) {
  const { width, height } = useWindowDimensions();
  const small = React.useMemo(
    () => ({
      width: Math.ceil(width / SHRINK) + 1,
      height: Math.ceil(height / SHRINK) + 1,
    }),
    [width, height]
  );
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: base }]}
    >
      {pages.map(({ template, i }) => (
        <Layer
          key={template.key}
          template={template}
          i={i}
          x={x}
          small={small}
        />
      ))}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? WASH.dark : WASH.light },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  small: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
    transform: [{ scale: SHRINK }],
  },
});
