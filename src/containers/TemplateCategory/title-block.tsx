import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ALL_CATEGORIES } from '@/lib/category-route';
import { F } from '@/lib/fonts';

import type { CatColors } from './theme';

/**
 * The big category title over the bento ("Fashion & Apparel", "52
 * templates"). It is the list's header, so it scrolls away with the feed;
 * on the way it collapses — scales down about its top-left corner (never
 * into the first row) — driven by the scroll offset on the UI thread.
 * Solid ink throughout: it never fades.
 */

const COLLAPSE = 90;

export function countLine(o: { total: number; of: number; query: string }) {
  const noun = (n: number) => (n === 1 ? 'template' : 'templates');
  if (!o.query.trim()) return `${o.of} ${noun(o.of)}`;
  return `${o.total} of ${o.of} ${noun(o.of)} match “${o.query.trim()}”`;
}

type Props = {
  c: CatColors;
  category: string;
  line: string;
  offset: SharedValue<number>;
};

export const TitleBlock = React.memo(function TitleBlock({
  c,
  category,
  line,
  offset,
}: Props) {
  const style = useAnimatedStyle(() => {
    const k = interpolate(
      offset.value,
      [0, COLLAPSE],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale: 1 - 0.14 * k }] };
  });
  const title = category === ALL_CATEGORIES ? 'All templates' : category;
  return (
    <Animated.View style={[s.root, style]}>
      <Text
        style={[s.title, { color: c.ink }]}
        numberOfLines={2}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={[s.line, { color: c.sub }]} numberOfLines={1}>
        {line}
      </Text>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  root: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    transformOrigin: 'left top',
  },
  title: {
    fontFamily: F.sans800,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
  },
  line: { fontFamily: F.sans500, fontSize: 13.5, marginTop: 4 },
});
