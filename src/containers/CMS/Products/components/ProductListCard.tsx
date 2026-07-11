import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductListItem } from '@/api/products';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { inr, primaryImageOf } from '../utils';

type Props = {
  product: ProductListItem;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
};

export const ProductListCard = React.memo(function ProductListCard({
  product,
  colors,
  onEdit,
  onDelete,
}: Props) {
  const image = primaryImageOf(product);
  const price = product.sellable_inventory?.price;
  const qty = product.sellable_inventory?.quantity_remaining;

  return (
    <Pressable
      onPress={onEdit}
      style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[st.thumb, { backgroundColor: colors.background }]}>
        {image ? (
          <Image source={{ uri: image }} style={st.thumbImg} contentFit="cover" />
        ) : (
          <Ionicons name="cube-outline" size={22} color={colors.textSecondary} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {product.product_name || 'Untitled product'}
        </Text>
        <Text style={[st.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.description || 'No description available'}
        </Text>
        <View style={st.metaRow}>
          {price != null ? <Text style={[st.price, { color: colors.accent }]}>{inr(price)}</Text> : null}
          {qty != null ? (
            <Text style={[st.qty, { color: colors.textSecondary }]}>· {qty} in stock</Text>
          ) : null}
        </View>
      </View>

      <Pressable onPress={onDelete} hitSlop={8} style={st.deleteBtn}>
        <Ionicons name="trash-outline" size={17} color={colors.danger} />
      </Pressable>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  name: cmsType.listTitle,
  desc: { ...cmsType.listMeta, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  price: { fontSize: 13.5, fontWeight: '800' },
  qty: { fontSize: 12 },
  deleteBtn: { padding: 6 },
});
