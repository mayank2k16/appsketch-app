/* eslint-disable unicorn/filename-case --
   Matches the PascalCase convention every sibling component in this
   directory already uses (StoreCard.tsx). */
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/containers/Marketplace/components/Skeleton';
import type { AppColors } from '@/lib/theme';

/** Mirrors StoreCard's logo/title/four-action layout so the loading list
 * doesn't jump/reflow once real cards swap in. */
export function StoreCardSkeleton({ t }: { t: AppColors }) {
  return (
    <View
      style={[
        st.card,
        { backgroundColor: t.card, borderColor: t.studioCardBorder },
      ]}
    >
      <View style={st.topRow}>
        <Skeleton t={t} width={44} height={44} borderRadius={5} />
        <View style={st.titleWrap}>
          <Skeleton t={t} height={14} width="60%" borderRadius={4} />
          <Skeleton
            t={t}
            height={11}
            width="40%"
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
      <View style={st.actionsRow}>
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            t={t}
            height={38}
            style={st.actionSlot}
            borderRadius={5}
          />
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 18,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleWrap: { flex: 1, paddingTop: 4 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionSlot: { flexBasis: '47%', flexGrow: 1 },
});
