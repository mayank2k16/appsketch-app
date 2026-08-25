import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductListItem } from '@/api/products';
import { useDeleteProduct, useProducts } from '@/api/products';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useVendorFilter } from '@/lib/store/vendor-filter-store';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { ManageProductModal } from './components/ManageProductModal';
import { ProductListCard } from './components/ProductListCard';
import { ProductsSkeleton } from './components/ProductsSkeleton';

// `onMenuPress` is part of `CmsTab['Component']`'s contract but unused here —
// the shell's persistent header already owns the hamburger button.
export function ProductsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();

  const productsQuery = useProducts();
  const products = productsQuery.data ?? [];

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const selectedVendor = useVendorFilter.use.selectedVendor();

  const filteredProducts = React.useMemo(() => {
    let list = products;
    if (selectedVendor) {
      list = list.filter((p) => (p.sold_by_id ?? p.tenant_id) === selectedVendor.id);
    }
    if (debouncedQuery.trim().length >= 3) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((p) => p.product_name?.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedVendor, debouncedQuery]);

  const manageModal = useModal();
  const [editingProduct, setEditingProduct] = React.useState<ProductListItem | null>(null);

  function openCreate() {
    setEditingProduct(null);
    manageModal.present();
  }
  function openEdit(product: ProductListItem) {
    setEditingProduct(product);
    manageModal.present();
  }

  const confirmModal = useModal();
  const [deletingProduct, setDeletingProduct] = React.useState<ProductListItem | null>(null);
  const deleteProduct = useDeleteProduct();

  function openDelete(product: ProductListItem) {
    setDeletingProduct(product);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingProduct(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: ProductListItem }) => (
      <ProductListCard product={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
    ),
    [colors]
  );

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>

      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Type at least 3 characters to search…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
          returnKeyType="search"
        />
      </View>
      <View style={st.header}>
        <Pressable onPress={openCreate} style={[st.createBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.createBtnText, { color: colors.accentText }]}>Add Product</Text>
        </Pressable>
      </View>
      {productsQuery.isLoading ? (
        <ProductsSkeleton colors={colors} />
      ) : products.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary, width: '100%', textAlign: 'center' }}>No products yet — add your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={st.center}>
              <Text style={{ color: colors.textSecondary }}>No products found matching your search</Text>
            </View>
          }
        />
      )}

      <ManageProductModal
        ref={manageModal.ref}
        colors={colors}
        product={editingProduct}
        onSuccess={() => {
          manageModal.dismiss();
          setEditingProduct(null);
        }}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete product?"
        description={deletingProduct ? `"${deletingProduct.product_name}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 6,
  },
  createBtnText: { fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 14,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
});
