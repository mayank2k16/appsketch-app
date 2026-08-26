import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_FIELD_COUNTS = [4, 1, 1, 2];

function FieldSkeleton({ colors }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <Skeleton colors={colors} width="35%" height={11} borderRadius={3} />
      <Skeleton colors={colors} width="100%" height={40} borderRadius={10} />
    </View>
  );
}

function CardSkeleton({ colors, fieldCount }: Props & { fieldCount: number }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width="40%" height={13} borderRadius={4} style={{ marginBottom: 4 }} />
      {Array.from({ length: fieldCount }).map((_, i) => (
        <FieldSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

/** Mirrors `ChannelsScreen`'s 4-card form shape (Email/SMS/Push/WhatsApp,
 * each with title + labeled fields) so the form doesn't jump/reflow once
 * real settings arrive — swapped in for the plain "Loading channel
 * settings…" text. */
export function ChannelsSkeleton({ colors }: Props) {
  return (
    <View style={st.scroll}>
      {CARD_FIELD_COUNTS.map((count, i) => (
        <CardSkeleton key={i} colors={colors} fieldCount={count} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 12, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
});
