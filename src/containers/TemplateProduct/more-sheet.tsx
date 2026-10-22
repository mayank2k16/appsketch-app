import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { BOX_RADIUS, type Geometry, GUTTER } from './geometry';
import { TemplateInfo } from './template-info';
import type { PageTheme } from './theme';

/**
 * "More" from the details box: everything the box leaves out — the full
 * description, tags and an ecosystem's apps — in a card that rises over the
 * box. A tap outside or "Done" closes it.
 */

type Props = {
  template: MarketTemplate | null;
  g: Geometry;
  t: PageTheme;
  dark: boolean;
  onClose: () => void;
};

export function MoreSheet({ template, g, t, dark, onClose }: Props) {
  if (!template) return null;
  const bottom = g.H - g.box.y - g.box.height;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill, s.dim]}
      >
        <Pressable
          accessibilityLabel="Close details"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(200)}
        exiting={SlideOutDown.duration(220)}
        style={[
          s.card,
          {
            bottom,
            maxHeight: g.H * 0.72,
            backgroundColor: t.panel,
            borderColor: t.panelEdge,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <TemplateInfo template={template} t={t} dark={dark} />
        </ScrollView>
        <PressableScale
          onPress={onClose}
          style={[s.done, { backgroundColor: t.primaryBg }]}
        >
          <Text style={[s.doneText, { color: t.primaryFg }]}>Done</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.32)' },
  card: {
    position: 'absolute',
    left: GUTTER,
    right: GUTTER,
    borderRadius: BOX_RADIUS,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: 14,
  },
  content: { padding: 6, paddingBottom: 18 },
  done: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontFamily: F.sans700, fontSize: 15 },
});
