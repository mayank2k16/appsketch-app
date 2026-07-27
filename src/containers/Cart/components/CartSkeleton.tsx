import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppColors } from '@/lib/theme';
import { Skeleton } from '@/containers/Marketplace/components/Skeleton';

type Props = { t: AppColors };

/** Mirrors the plan-summary + order-summary card layout so the real content
 * doesn't jump/reflow once plans finish loading. */
export function CartSkeleton({ t }: Props) {
  return (
    <>
      <View style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={st.rowBetween}>
          <Skeleton t={t} height={17} width="45%" borderRadius={5} />
          <Skeleton t={t} height={17} width={64} borderRadius={5} />
        </View>
        <Skeleton t={t} height={11} width={100} borderRadius={4} style={{ marginTop: 10 }} />

        <View style={st.featureList}>
          {[70, 55, 62].map((w, i) => (
            <View key={i} style={st.featureRow}>
              <Skeleton t={t} height={13} width={13} borderRadius={7} />
              <Skeleton t={t} height={10} width={`${w}%`} borderRadius={4} />
            </View>
          ))}
        </View>

        <Skeleton t={t} height={11} width={80} borderRadius={4} style={{ marginTop: 14 }} />
      </View>

      <View style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Skeleton t={t} height={14} width={110} borderRadius={4} />

        <View style={[st.rowBetween, { marginTop: 14 }]}>
          <Skeleton t={t} height={11} width={90} borderRadius={4} />
          <Skeleton t={t} height={11} width={56} borderRadius={4} />
        </View>

        <View style={[st.divider, { backgroundColor: t.border }]} />

        <View style={st.rowBetween}>
          <Skeleton t={t} height={14} width={64} borderRadius={4} />
          <Skeleton t={t} height={14} width={74} borderRadius={4} />
        </View>
      </View>

      <Skeleton t={t} height={50} borderRadius={14} />
    </>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureList: { marginTop: 14, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: 1, marginVertical: 12 },
});
