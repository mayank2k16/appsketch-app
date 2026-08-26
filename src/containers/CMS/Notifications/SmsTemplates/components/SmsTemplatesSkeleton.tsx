import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;

function SmsTemplateCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="55%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width={16} height={16} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width="90%" height={11} borderRadius={4} />
      <Skeleton colors={colors} width="60%" height={11} borderRadius={4} />
    </View>
  );
}

/** Mirrors `SmsTemplateRow`'s shape (title + delete icon, 2-line body) so
 * the list doesn't jump/reflow once real templates arrive — swapped in for
 * the plain "Loading SMS templates…" text. */
export function SmsTemplatesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <SmsTemplateCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
