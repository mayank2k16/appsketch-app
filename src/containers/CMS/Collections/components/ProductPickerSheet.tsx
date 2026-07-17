import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductListItem } from '@/api/products';
import { useProducts } from '@/api/products';

import { CmsButton, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  alreadySelectedIds: number[];
  onDone: (picked: ProductListItem[]) => void;
};

/** Search + checkbox multi-select over the full product list — same recipe
 * as Categories' `LinkProductSheet`, but purely local state: picking here
 * doesn't call any API, it just hands the picked products back to
 * `ManageCollectionModal` to merge into its own `product_ids` form field,
 * matching Vite's `AddCollectionModal` reusing `Categories/LinkProduct.jsx`
 * the same way. */
export const ProductPickerSheet = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, alreadySelectedIds, onDone }, ref) => {
    const [query, setQuery] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const productsQuery = useProducts();

    function toggle(id: number) {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    }

    function matches(product: ProductListItem, q: string) {
      const haystack = [product.product_name, product.catalogue_number, product.previous_catalogue_number, ...(product.alternate_names ?? [])]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return haystack.some((v) => v.includes(q));
    }

    const allProducts = productsQuery.data ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q ? allProducts.filter((p) => matches(p, q)) : allProducts;

    function handleDone() {
      const picked = allProducts.filter((p) => selectedIds.includes(p.id));
      setSelectedIds([]);
      setQuery('');
      onDone(picked);
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title="Link Products">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[st.searchWrap, { borderColor: colors.border }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products…"
              placeholderTextColor={colors.textSecondary}
              style={[st.searchInput, { color: colors.textPrimary }]}
            />
          </View>

          <BottomSheetFlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 90 }}
            renderItem={({ item }) => {
              const alreadyLinked = alreadySelectedIds.includes(item.id);
              const checked = selectedIds.includes(item.id);
              return (
                <Pressable
                  onPress={() => !alreadyLinked && toggle(item.id)}
                  style={[st.row, { borderColor: colors.border }, alreadyLinked && st.rowDisabled]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    {alreadyLinked ? (
                      <Text style={[st.desc, { color: colors.textSecondary }]}>Already linked</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={checked || alreadyLinked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked || alreadyLinked ? colors.accent : colors.textSecondary}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={{ color: colors.textSecondary, padding: 16 }}>No products found.</Text>}
          />

          <View style={[st.footer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <CmsButton
              colors={colors}
              label={`Add ${selectedIds.length || ''} Product${selectedIds.length === 1 ? '' : 's'}`}
              onPress={handleDone}
              disabled={selectedIds.length === 0}
            />
          </View>
        </View>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInput: { fontSize: 14, height: 38 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowDisabled: { opacity: 0.5 },
  name: cmsType.listSubtitle,
  desc: { ...cmsType.listMeta, marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
