import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';

import type { Geometry } from './geometry';
import type { PageTheme } from './theme';
import type { ProductMotion } from './use-product-transition';

/**
 * The page's fixed controls (they do not move with the pager): the close X
 * in the hero's top-left corner (just left of the phone's rim for an app).
 * A website's Mobile | Tablet | Desktop switch is in the details box's top
 * row (details-panel.tsx). Paging is by swipe
 * (the next and previous templates peek in at the edges).
 */

type Props = {
  g: Geometry;
  m: ProductMotion;
  t: PageTheme;
  dark: boolean;
  onClose: () => void;
  /** The centred template is an app (in the phone frame). */
  app: boolean;
};

/** The close button, a small panel-coloured circle. It follows a pull-down
 *  with the hero. */
function CloseButton({ g, m, t, app, onClose }: Props) {
  const close = app ? g.closeApp : g.close;
  const style = useAnimatedStyle(() => ({
    opacity: m.reveal.value * (1 - Math.min(m.drag.value / 220, 1)),
    transform: [{ translateY: m.drag.value }],
  }));
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[s.abs, { left: close.x, top: close.y }, style]}
    >
      <PressableScale
        accessibilityLabel="Close"
        hitSlop={10}
        onPress={onClose}
        style={[
          s.close,
          {
            width: close.width,
            height: close.height,
            borderRadius: close.width / 2,
            backgroundColor: t.panel,
            borderColor: t.panelEdge,
          },
        ]}
      >
        <Ionicons name="close" size={18} color={t.ink} />
      </PressableScale>
    </Animated.View>
  );
}

export const HeroChrome = React.memo(function HeroChrome(p: Props) {
  return <CloseButton {...p} />;
});

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  close: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
