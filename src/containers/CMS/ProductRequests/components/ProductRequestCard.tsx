import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductRequestItem } from '@/api/product-requests';
import type { VendorListItem } from '@/api/vendors';
import { resolveMediaUrl } from '@/lib/media-url';

import { CmsStatusBadge } from '../../components';
import { inr, primaryImageOf } from '../../Products/utils';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getProductRequestStatusMeta } from '../utils';

const VENDOR_STATUS_META: Record<string, { label: string; color: string }> = {
  approved: { label: 'Approved', color: '#16A34A' },
  pending: { label: 'Pending', color: '#D97706' },
  rejected: { label: 'Rejected', color: '#DC2626' },
};

type Props = {
  product: ProductRequestItem;
  vendor?: VendorListItem;
  colors: CmsThemeColors;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
};

export const ProductRequestCard = React.memo(function ProductRequestCard({
  product,
  vendor,
  colors,
  isSelected,
  onToggle,
  onView,
}: Props) {
  const image = resolveMediaUrl(primaryImageOf(product));
  const images = product.images?.length ? product.images : product.photo ? [product.photo] : [];
  const price = product.sellable_inventory?.price;
  const marketPrice = product.sellable_inventory?.market_price;
  const categoryNames = (product.categories ?? []).map((c) => c.name).filter(Boolean);
  const variantCount = product.variants?.length ?? 0;
  const isRejected = product.status === 'REJECTED';
  const vendorStatusMeta = vendor?.status ? VENDOR_STATUS_META[String(vendor.status).toLowerCase()] : undefined;

  return (
    <Pressable
      onPress={onToggle}
      style={[
        st.card,
        { backgroundColor: colors.surface, borderColor: isSelected ? colors.accent : colors.border },
        isSelected && { backgroundColor: `${colors.accent}0F` },
      ]}
    >
      <View style={st.topRow}>
        <View style={[st.thumb, { backgroundColor: colors.background }]}>
          {image ? (
            <Image source={{ uri: image }} style={st.thumbImg} contentFit="cover" />
          ) : (
            <Ionicons name="cube-outline" size={22} color={colors.textSecondary} />
          )}
          {images.length > 1 ? (
            <View style={[st.imageCount, { backgroundColor: colors.textPrimary }]}>
              <Text style={[st.imageCountText, { color: colors.surface }]}>+{images.length - 1}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1 }}>
          <View style={st.nameRow}>
            <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {product.product_name || 'Untitled Product'}
            </Text>
            <CmsStatusBadge meta={getProductRequestStatusMeta(product.status)} />
          </View>
          <Text style={[st.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {product.description || 'No description provided.'}
          </Text>
        </View>

        <Pressable onPress={onView} hitSlop={8} style={[st.viewBtn, { borderColor: colors.border }]}>
          <Ionicons name="eye-outline" size={16} color={colors.textPrimary} />
        </Pressable>

        <View
          style={[
            st.checkbox,
            { borderColor: isSelected ? colors.accent : colors.border },
            isSelected && { backgroundColor: colors.accent },
          ]}
        >
          {isSelected ? <Ionicons name="checkmark" size={14} color={colors.accentText} /> : null}
        </View>
      </View>

      {(product.catalogue_number || categoryNames.length > 0 || variantCount > 0) && (
        <View style={st.chipRow}>
          {product.catalogue_number ? (
            <View style={[st.chip, { borderColor: colors.border }]}>
              <Text style={[st.chipText, { color: colors.textSecondary }]}>Cat# {product.catalogue_number}</Text>
            </View>
          ) : null}
          {categoryNames.slice(0, 2).map((name) => (
            <View key={name} style={[st.chip, { borderColor: colors.border }]}>
              <Text style={[st.chipText, { color: colors.textSecondary }]}>{name}</Text>
            </View>
          ))}
          {categoryNames.length > 2 ? (
            <View style={[st.chip, { borderColor: colors.border }]}>
              <Text style={[st.chipText, { color: colors.textSecondary }]}>+{categoryNames.length - 2} more</Text>
            </View>
          ) : null}
          {variantCount > 0 ? (
            <View style={[st.chip, { borderColor: colors.border }]}>
              <Text style={[st.chipText, { color: colors.textSecondary }]}>{variantCount} variants</Text>
            </View>
          ) : null}
        </View>
      )}

      {price != null ? (
        <View style={st.priceRow}>
          <Text style={[st.price, { color: colors.accent }]}>{inr(price)}</Text>
          {marketPrice != null && String(marketPrice) !== String(price) ? (
            <Text style={[st.mrp, { color: colors.textSecondary }]}>{inr(marketPrice)}</Text>
          ) : null}
        </View>
      ) : null}

      {isRejected && product.review_notes ? (
        <View
          style={[st.rejectionBanner, { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}40` }]}
        >
          <Text style={[st.rejectionText, { color: colors.danger }]}>
            <Text style={{ fontWeight: '800' }}>Rejection reason: </Text>
            {product.review_notes}
          </Text>
        </View>
      ) : null}

      <View style={st.vendorRow}>
        <Ionicons name="storefront-outline" size={13} color={colors.textSecondary} />
        <Text style={[st.vendor, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.vendor_name?.slice(0, 30) || 'Unknown Vendor'}
        </Text>
        {vendorStatusMeta ? (
          <View
            style={[
              st.vendorBadge,
              { backgroundColor: `${vendorStatusMeta.color}18`, borderColor: `${vendorStatusMeta.color}40` },
            ]}
          >
            <Text style={[st.vendorBadgeText, { color: vendorStatusMeta.color }]}>{vendorStatusMeta.label}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  imageCount: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  imageCountText: { fontSize: 9, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...cmsType.listTitle, flexShrink: 1 },
  desc: { ...cmsType.listMeta, marginTop: 2 },
  viewBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10.5, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 14, fontWeight: '800' },
  mrp: { fontSize: 12, textDecorationLine: 'line-through' },
  rejectionBanner: { borderWidth: 1, borderRadius: 10, padding: 8 },
  rejectionText: { fontSize: 11.5, lineHeight: 16 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendor: { ...cmsType.listMeta, flexShrink: 1 },
  vendorBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  vendorBadgeText: { fontSize: 10, fontWeight: '700' },
});
