import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductRequestItem } from '@/api/product-requests';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getProductRequestStatusMeta, money } from '../utils';

type Props = {
  product: ProductRequestItem;
  colors: CmsThemeColors;
  isSelected: boolean;
  onToggle: () => void;
};

export const ProductRequestCard = React.memo(function ProductRequestCard({
  product,
  colors,
  isSelected,
  onToggle,
}: Props) {
  const image = product.photo || product.images?.[0] || product.image;

  return (
    <Pressable
      onPress={onToggle}
      style={[
        st.card,
        { backgroundColor: colors.surface, borderColor: isSelected ? colors.accent : colors.border },
        isSelected && { backgroundColor: `${colors.accent}0F` },
      ]}
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
          {product.product_name || 'Untitled Product'}
        </Text>
        <Text style={[st.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.description || 'No description provided.'}
        </Text>
        <View style={st.metaRow}>
          <Text style={[st.price, { color: colors.accent }]}>
            {product.currency?.symbol || 'Rs'} {money(product.market_price)}
          </Text>
          <CmsStatusBadge meta={getProductRequestStatusMeta(product.status)} />
        </View>
        <Text style={[st.vendor, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.vendor_name?.slice(0, 25) || 'Unknown Vendor'}
        </Text>
      </View>

      <View
        style={[
          st.checkbox,
          { borderColor: isSelected ? colors.accent : colors.border },
          isSelected && { backgroundColor: colors.accent },
        ]}
      >
        {isSelected ? <Ionicons name="checkmark" size={14} color={colors.accentText} /> : null}
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
    borderWidth: 1.5,
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontSize: 13.5, fontWeight: '800' },
  vendor: { ...cmsType.listMeta, marginTop: 3 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
