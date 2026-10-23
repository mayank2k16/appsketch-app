import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/containers/Marketplace/components/Skeleton';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

/** Mirrors PlanCard's layout so nothing reflows when the plans arrive. */
export function PlanSkeleton({ t, p }: { t: AppColors; p: PricingPalette }) {
  return (
    <View
      style={[
        st.card,
        { backgroundColor: p.cardBg, borderColor: p.cardBorder },
      ]}
    >
      <Skeleton t={t} height={21} width="40%" borderRadius={5} />
      <Skeleton t={t} height={13} width="78%" borderRadius={4} style={st.gap} />
      <Skeleton t={t} height={62} borderRadius={14} style={st.well} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          t={t}
          height={13}
          width={`${82 - i * 9}%`}
          borderRadius={4}
          style={st.line}
        />
      ))}
      <Skeleton t={t} height={50} borderRadius={14} style={st.cta} />
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  gap: { marginTop: 8 },
  well: { marginTop: 16, marginBottom: 18 },
  line: { marginBottom: 10 },
  cta: { marginTop: 10 },
});
