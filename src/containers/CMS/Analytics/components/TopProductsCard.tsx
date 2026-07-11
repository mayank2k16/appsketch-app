import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TopProduct } from '@/api/analytics';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { inr, toNumber } from '../utils';

type Props = { colors: CmsThemeColors; productsData: TopProduct[] | undefined };

/** Vite's `ProductsTable` is a literal desktop `<table>` — per the CMS
 * porting convention, dense tables become a mobile card/row list instead. */
export function TopProductsCard({ colors, productsData }: Props) {
  const products = productsData ?? [];

  return (
    <CmsCard colors={colors} title="Top Selling Products">
      {products.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ color: colors.textSecondary }}>No product sales in this period.</Text>
        </View>
      ) : (
        <View>
          {products.map((p, i) => (
            <View
              key={`${p.product_name}-${i}`}
              style={[st.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            >
              <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={2}>
                {p.product_name}
              </Text>
              <Text style={[st.sold, { color: colors.textSecondary }]}>{toNumber(p.total_quantity_sold)} sold</Text>
              <Text style={[st.sales, { color: colors.accent }]}>{inr(p.total_sales)}</Text>
            </View>
          ))}
        </View>
      )}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  name: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  sold: { fontSize: 11.5, fontWeight: '500' },
  sales: { fontSize: 12.5, fontWeight: '800', minWidth: 70, textAlign: 'right' },
  empty: { paddingVertical: 20, alignItems: 'center' },
});
