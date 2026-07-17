import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryNode } from '@/api/categories';
import { useDeleteProductFromCategory } from '@/api/categories';
import { useProducts } from '@/api/products';

import { CmsButton, CmsCard, CmsField, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  category: CategoryNode | null;
  onEdit: (category: CategoryNode) => void;
  onAddSubcategory: (parentId: number) => void;
  onDelete: (category: CategoryNode) => void;
  onLinkProducts: (category: CategoryNode) => void;
};

export const CategoryDetailSheet = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, category, onEdit, onAddSubcategory, onDelete, onLinkProducts }, ref) => {
    const productsQuery = useProducts();
    const unlinkProduct = useDeleteProductFromCategory();

    if (!category) {
      return (
        <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Category">
          <View style={{ padding: 24 }}>
            <Text style={{ color: colors.textSecondary }}>No category selected.</Text>
          </View>
        </CmsModal>
      );
    }

    const linkedProducts = (productsQuery.data ?? []).filter((p) => category.products?.includes(p.id));

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={category.name}>
        <BottomSheetScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {category.image || category.banner_image ? (
            <Image source={{ uri: category.banner_image || category.image || undefined }} style={st.banner} contentFit="cover" />
          ) : null}

          <CmsCard colors={colors}>
            <View style={st.fieldGrid}>
              <CmsField label="Description" value={category.description} colors={colors} />
              <CmsField label="Href Path" value={category.href_path} colors={colors} />
              <CmsField label="Colour" value={category.colour} colors={colors} />
              <CmsField label="Shown on Home Page" value={category.home_page ? 'Yes' : 'No'} colors={colors} />
            </View>
          </CmsCard>

          <View style={st.actionsRow}>
            <CmsButton colors={colors} label="Edit" variant="ghost" onPress={() => onEdit(category)} style={{ flex: 1 }} />
            <CmsButton colors={colors} label="Add Subcategory" variant="ghost" onPress={() => onAddSubcategory(category.id)} style={{ flex: 1 }} />
          </View>
          <CmsButton colors={colors} label="Delete" variant="danger" onPress={() => onDelete(category)} />

          <CmsCard colors={colors} title="Linked Products">
            <CmsButton colors={colors} label="Link Product" onPress={() => onLinkProducts(category)} />
            {linkedProducts.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No products linked yet.</Text>
            ) : (
              linkedProducts.map((product) => (
                <View key={product.id} style={[st.productRow, { borderColor: colors.border }]}>
                  <Text style={[st.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {product.product_name}
                  </Text>
                  <Pressable
                    onPress={() => unlinkProduct.mutate({ category_id: category.id, id: product.id })}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </CmsCard>
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  banner: { width: '100%', height: 120, borderRadius: 12 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: { ...cmsType.listSubtitle, flex: 1, marginRight: 8 },
});
