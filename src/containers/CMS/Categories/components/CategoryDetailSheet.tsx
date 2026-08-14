import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import type { CategoryNode } from '@/api/categories';
import { useDeleteProductFromCategory, useReorderCategoryProducts } from '@/api/categories';
import { useProducts } from '@/api/products';
import { resolveMediaUrl } from '@/lib/media-url';

import { CmsButton, CmsCard, CmsField, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { moveItem } from '../utils';
import { DraggableRow } from './DraggableRow';

// Fixed height so the drag math sees a uniform run of steps, same
// requirement as CATEGORY_ROW_HEIGHT in CategoryTreeRow.
const PRODUCT_ROW_HEIGHT = 44;

type Props = {
  colors: CmsThemeColors;
  category: CategoryNode | null;
  onEdit: (category: CategoryNode) => void;
  onAddSubcategory: (parentId: number) => void;
  onDelete: (category: CategoryNode) => void;
  onLinkProducts: (category: CategoryNode) => void;
};

export const CategoryDetailSheet = React.forwardRef<BottomSheetModal, Props>(
  (
    { colors, category, onEdit, onAddSubcategory, onDelete, onLinkProducts },
    ref
  ) => {
    const productsQuery = useProducts();
    const unlinkProduct = useDeleteProductFromCategory();
    const reorderProducts = useReorderCategoryProducts();

    // Preserve the backend's per-category product order (`category.products`
    // is already ranked by the link's priority) instead of filtering the
    // global catalogue, which returns products in catalogue order and
    // silently discards any drag order on reload — the exact trap the web
    // CMS documents at `Categories.jsx:124-136`.
    const byId = React.useMemo(
      () => new Map((productsQuery.data ?? []).map((p) => [p.id, p] as const)),
      [productsQuery.data]
    );
    const linkedProducts = React.useMemo(
      () =>
        (category?.products ?? [])
          .map((id) => byId.get(id))
          .filter((p): p is NonNullable<typeof p> => !!p),
      [category?.products, byId]
    );

    // Only one product drag can be in flight at a time; shared values live
    // here rather than per-row.
    const activeGroup = useSharedValue('');
    const dragY = useSharedValue(0);
    const fromIndex = useSharedValue(0);
    const toIndex = useSharedValue(0);
    const [scrollEnabled, setScrollEnabled] = React.useState(true);

    const handleProductDragStart = React.useCallback(() => setScrollEnabled(false), []);
    const handleProductDragEnd = React.useCallback(
      (from: number, to: number) => {
        setScrollEnabled(true);
        if (!category || from === to) return;
        const nextIds = moveItem(
          linkedProducts.map((p) => p.id),
          from,
          to
        );
        reorderProducts.mutate({ category_id: category.id, product_ids: nextIds });
      },
      [category, linkedProducts, reorderProducts]
    );

    if (!category) {
      return (
        <CmsModal
          ref={ref}
          colors={colors}
          snapPoints={['40%']}
          title="Category"
        >
          <View style={{ padding: 24 }}>
            <Text style={{ color: colors.textSecondary }}>
              No category selected.
            </Text>
          </View>
        </CmsModal>
      );
    }

    const bannerUri = resolveMediaUrl(category.banner_image || category.image);

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['85%']}
        title={category.name}
      >
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          scrollEnabled={scrollEnabled}
        >
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              style={st.banner}
              contentFit="cover"
            />
          ) : null}

          <CmsCard colors={colors}>
            <View style={st.fieldGrid}>
              <CmsField
                label="Description"
                value={category.description}
                colors={colors}
              />
              <CmsField
                label="Href Path"
                value={category.href_path}
                colors={colors}
              />
              <CmsField
                label="Colour"
                value={category.colour}
                colors={colors}
              />
              <CmsField
                label="Shown on Home Page"
                value={category.home_page ? 'Yes' : 'No'}
                colors={colors}
              />
            </View>
          </CmsCard>

          <View style={st.actionsRow}>
            <CmsButton
              colors={colors}
              label="Edit"
              variant="ghost"
              onPress={() => onEdit(category)}
              style={{ flex: 1 }}
            />
            <CmsButton
              colors={colors}
              label="Add Subcategory"
              variant="ghost"
              onPress={() => onAddSubcategory(category.id)}
              style={{ flex: 1 }}
            />
          </View>
          <CmsButton
            colors={colors}
            label="Delete"
            variant="danger"
            onPress={() => onDelete(category)}
          />

          <CmsCard colors={colors} title="Linked Products">
            <CmsButton
              colors={colors}
              label="Link Product"
              onPress={() => onLinkProducts(category)}
            />
            {linkedProducts.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No products linked yet.
              </Text>
            ) : (
              linkedProducts.map((product, index) => (
                <DraggableRow
                  key={product.id}
                  rowHeight={PRODUCT_ROW_HEIGHT}
                  groupKey={`product-${category.id}`}
                  indexInGroup={index}
                  groupSize={linkedProducts.length}
                  enabled={linkedProducts.length > 1}
                  activeGroup={activeGroup}
                  dragY={dragY}
                  fromIndex={fromIndex}
                  toIndex={toIndex}
                  onDragStart={handleProductDragStart}
                  onDragEnd={handleProductDragEnd}
                >
                  <View style={[st.productRow, { borderColor: colors.border }]}>
                    <Text
                      style={[st.productName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {product.product_name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        unlinkProduct.mutate({
                          category_id: category.id,
                          id: product.id,
                        })
                      }
                      hitSlop={6}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                </DraggableRow>
              ))
            )}
          </CmsCard>
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  banner: { width: '100%', height: 180, borderRadius: 12 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Fixed height (not paddingVertical) so PRODUCT_ROW_HEIGHT's drag math
    // matches every row's actual size.
    height: PRODUCT_ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: { ...cmsType.listSubtitle, flex: 1, marginRight: 8 },
});
