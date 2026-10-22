import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { thumbOf } from '@/containers/Home/TemplateReel/layout';

import { paletteOf } from './live-loader';

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

const BLUR = 60;
const WASH = { light: 'rgba(255,255,255,0.3)', dark: 'rgba(0,0,0,0.38)' };

type LayerProps = {
  template: MarketTemplate;
  i: number;
  x: SharedValue<number>;
};

const Layer = React.memo(function Layer({ template, i, x }: LayerProps) {
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
          transition={0}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={paletteOf(template.key)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
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
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: base }]}
    >
      {pages.map(({ template, i }) => (
        <Layer key={template.key} template={template} i={i} x={x} />
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
