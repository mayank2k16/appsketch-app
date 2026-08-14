import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductListItem } from '@/api/products';
import { resolveMediaUrl } from '@/lib/media-url';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { inr, primaryImageOf } from '../utils';
import { colors } from '@/components/ui';

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
  const image = resolveMediaUrl(primaryImageOf(product));
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
        <Text style={[st.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {product.description || 'No description available'}
        </Text>
        {product.sold_by_name ? (
          <Text style={[st.attribution, { color: colors.textSecondary }]} numberOfLines={1}>
            Sold By {product.sold_by_name.slice(0, 25)}
          </Text>
        ) : null}
        {product.tenant_name ? (
          <Text style={[st.attribution, { color: colors.textSecondary }]} numberOfLines={1}>
            Tenant: {product.tenant_name.slice(0, 25)}
          </Text>
        ) : null}
        <View style={st.metaRow}>
          {price != null ? <Text style={[st.price, { color: colors.accent }]}>{inr(price)}</Text> : null}
          {qty != null ? (
            <Text style={[st.qty, { color: colors.textSecondary }]}>{qty} in stock</Text>
          ) : null}
        </View>
      </View>

      <View style={st.actions}>
        <Pressable onPress={onEdit} hitSlop={8} style={[st.actionBtn, { borderColor: colors.border }]}>
          <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={[st.actionBtn, { borderColor: colors.border }]}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
      </View>
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
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  name: cmsType.listTitle,
  desc: { ...cmsType.listMeta, marginTop: 2 },
  attribution: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  price: { fontSize: 13.5, fontWeight: '800' },
  qty: { fontSize: 12, flex: 1 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 'auto' },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
