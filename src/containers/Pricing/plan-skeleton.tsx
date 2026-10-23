import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/containers/Marketplace/components/Skeleton';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

/** Mirrors the compact PlanCard so nothing reflows when the plans arrive. */
export function PlanSkeleton({ t, p }: { t: AppColors; p: PricingPalette }) {
  return (
    <View
      style={[
        st.card,
        { backgroundColor: p.cardBg, borderColor: p.cardBorder },
      ]}
    >
      <View style={st.head}>
        <View style={st.grow}>
          <Skeleton t={t} height={18} width="45%" borderRadius={5} />
          <Skeleton
            t={t}
            height={12}
            width="85%"
            borderRadius={4}
            style={st.gap}
          />
        </View>
        <Skeleton t={t} height={18} width={80} borderRadius={5} />
      </View>
      <Skeleton t={t} height={12} width="96%" borderRadius={4} />
      <Skeleton t={t} height={12} width="70%" borderRadius={4} />
      <Skeleton t={t} height={42} borderRadius={12} style={st.gap} />
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  head: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  grow: { flex: 1 },
  gap: { marginTop: 6 },
});
