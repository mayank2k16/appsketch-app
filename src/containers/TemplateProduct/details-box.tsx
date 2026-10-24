import { BlurView } from 'expo-blur';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';

import { DetailsPanel } from './details-panel';
import { BOX_RADIUS, type Geometry } from './geometry';
import type { Device } from './live-url';
import type { PageTheme } from './theme';
import type { ProductMotion } from './use-product-transition';

/**
 * The details box under the hero: frosted glass (the blurred page backdrop
 * shows through, so the eye stays on the template) holding the centred template's details, "3 / 52 · Swipe ›" on
 * the name's row (the cue goes after the first swipe). Swiping on it pages
 * too, and a pull down on it closes the page.
 */

export type BoxPage = { template: MarketTemplate; i: number };

type Props = {
  pages: BoxPage[];
  index: number;
  /** Where page i sits in its category: "n / of". */
  placeOf: (i: number) => { n: number; of: number };
  swiped: boolean;
  x: SharedValue<number>;
  g: Geometry;
  m: ProductMotion;
  t: PageTheme;
  dark: boolean;
  gesture: GestureType;
  onMore: (template: MarketTemplate) => void;
  device: Device;
  onDevice: (d: Device) => void;
};

export function DetailsBox(p: Props) {
  const { g, m, t } = p;
  const rise = useAnimatedStyle(() => ({
    opacity: m.reveal.value * (1 - Math.min(m.drag.value / 220, 1)),
    transform: [{ translateY: (1 - m.reveal.value) * 28 }],
  }));
  return (
    <GestureDetector gesture={p.gesture}>
      <Animated.View
        style={[
          s.box,
          {
            left: g.box.x,
            top: g.box.y,
            width: g.box.width,
            height: g.box.height,
            borderColor: p.dark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.7)',
          },
          rise,
        ]}
      >
        <BlurView
          intensity={p.dark ? 40 : 50}
          tint={p.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: p.dark
                ? 'rgba(17,17,19,0.3)'
                : 'rgba(255,255,255,0.32)',
            },
          ]}
        />
        {p.pages.map(({ template, i }) => (
          <DetailsPanel
            key={template.key}
            template={template}
            i={i}
            x={p.x}
            m={m}
            current={i === p.index}
            t={t}
            dark={p.dark}
            n={p.placeOf(i).n}
            of={p.placeOf(i).of}
            swiped={p.swiped}
            onMore={p.onMore}
            device={p.device}
            onDevice={p.onDevice}
          />
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  box: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: BOX_RADIUS,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
