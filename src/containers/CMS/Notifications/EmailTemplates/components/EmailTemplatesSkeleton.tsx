import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;

function EmailTemplateCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="55%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width={16} height={16} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width="75%" height={11} borderRadius={4} />
    </View>
  );
}

/** Mirrors `EmailTemplateRow`'s shape (name + delete icon, subject line) so
 * the list doesn't jump/reflow once real templates arrive — swapped in for
 * the plain "Loading email templates…" text. */
export function EmailTemplatesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <EmailTemplateCardSkeleton key={i} colors={colors} />
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
