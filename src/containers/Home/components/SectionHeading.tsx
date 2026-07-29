import * as React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import type { HomeColors } from '../theme/HomeTheme';

type Props = {
  eyebrow: string;
  /** One GradientText per entry, so multi-line headings keep the fade
   *  per-line instead of stretching it across a wrapped block of text. */
  lines: string[];
  t: HomeColors;
  style?: StyleProp<ViewStyle>;
};

// Shared eyebrow + gradient-heading block for every Home section below the
// Hero — same fade recipe as Hero's own heading (white → heroHeadingFade),
// same 34px size and spacing everywhere, so sections don't each redefine it.
export function SectionHeading({ eyebrow, lines, t, style }: Props) {
  return (
    <View style={style}>
      <View style={s.eyebrowRow}>
        <View style={[s.eyebrowDot, { backgroundColor: t.accent }]} />
        <Text style={[s.eyebrow, { color: t.tagText }]}>{eyebrow}</Text>
      </View>

      <View style={s.headingWrap}>
        {lines.map((line, i) => (
          <GradientText
            key={i}
            style={s.heading}
            colors={[t.text, t.text, t.heroHeadingFade]}
            locations={[0, 0.1, 0.8]}
          >
            {line}
          </GradientText>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: F.sans700,
    fontSize: 12,
    letterSpacing: 1.6,
  },

  headingWrap: {
    marginBottom: 26,
  },
  heading: {
    fontFamily: F.display900,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
});
