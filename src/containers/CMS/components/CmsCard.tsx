import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  title?: string;
  children: React.ReactNode;
  style?: object;
};

/** Bordered/padded/rounded section container — the design OrderDetailModal
 * established. Every CMS modal/form groups its content in one or more of
 * these instead of hand-rolling its own container per screen. */
export function CmsCard({ colors, title, children, style }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {title ? <Text style={[st.title, { color: colors.textPrimary }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  title: cmsType.sectionTitle,
});
