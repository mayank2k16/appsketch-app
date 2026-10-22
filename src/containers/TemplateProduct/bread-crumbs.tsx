import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';

import { F } from '@/lib/fonts';

import type { Geometry } from './geometry';
import type { PageTheme } from './theme';
import type { ProductMotion } from './use-product-transition';

/**
 * `Templates › Category › Name` in the strip under the status bar, one
 * line: the name (a solid chip, the current page) truncates, the category
 * never does. "Templates" goes back
 * to Home, the category opens its screen, the name is plain text. A segment
 * that changes as you swipe into another category (or template) fades in.
 */

type Props = {
  g: Geometry;
  m: ProductMotion;
  t: PageTheme;
  category: string | null;
  name: string;
  onHome: () => void;
  onCategory: (name: string) => void;
};

const FADE = FadeIn.duration(160);

function Sep({ color }: { color: string }) {
  return <Ionicons name="chevron-forward" size={11} color={color} />;
}

export const BreadCrumbs = React.memo(function BreadCrumbs(p: Props) {
  const { g, m, t, category } = p;
  const fade = useAnimatedStyle(() => ({
    opacity: m.reveal.value * (1 - Math.min(m.drag.value / 220, 1)),
  }));
  const link = [s.text, s.link, { color: t.ink }];
  return (
    <Animated.View
      style={[
        s.row,
        {
          left: g.crumbs.x,
          top: g.crumbs.y,
          width: g.crumbs.width,
          height: g.crumbs.height,
        },
        fade,
      ]}
    >
      <Pressable
        accessibilityRole="link"
        hitSlop={10}
        onPress={p.onHome}
        style={s.fixed}
      >
        <Text style={link}>Templates</Text>
      </Pressable>
      {category ? (
        <>
          <Sep color={t.muted} />
          <Animated.View key={category} entering={FADE} style={s.fixed}>
            <Pressable
              accessibilityRole="link"
              hitSlop={10}
              onPress={() => p.onCategory(category)}
            >
              <Text style={link} numberOfLines={1}>
                {category}
              </Text>
            </Pressable>
          </Animated.View>
        </>
      ) : null}
      <Sep color={t.muted} />
      <Animated.View
        key={p.name}
        entering={FADE}
        style={[s.chip, { backgroundColor: t.panel, borderColor: t.panelEdge }]}
      >
        <Text numberOfLines={1} style={[s.text, s.name, { color: t.ink }]}>
          {p.name}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  row: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixed: { flexShrink: 0 },
  text: { fontSize: 12.5 },
  link: { fontFamily: F.sans600 },
  // The current page: a solid chip in the panel colour, so it reads on any
  // template's blurred backdrop (plain muted text vanished on light ones).
  chip: {
    flexShrink: 1,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  name: { fontFamily: F.sans700 },
});
