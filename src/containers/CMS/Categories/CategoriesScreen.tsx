import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryNode } from '@/api/categories';
import { useCategoryTree, useDeleteCategoryAtAnyLevel } from '@/api/categories';
import { ConfirmModal, useModal } from '@/components/ui';

import { useCmsTheme } from '../theme';
import { CategoryDetailSheet } from './components/CategoryDetailSheet';
import { CategoryTreeRow } from './components/CategoryTreeRow';
import { LinkProductSheet } from './components/LinkProductSheet';
import { ManageCategoryModal } from './components/ManageCategoryModal';
import { filterTopLevelCategories } from './utils';

type ManageTarget = {
  mode: 'create' | 'edit' | 'addSub';
  category: CategoryNode | null;
  parentId: number | null;
  key: number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CategoriesScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const [expandedMap, setExpandedMap] = React.useState<Record<number, boolean>>({});

  const categoriesQuery = useCategoryTree();
  const deleteCategory = useDeleteCategoryAtAnyLevel();
  const categories = categoriesQuery.data ?? [];
  const filteredCategories = React.useMemo(() => filterTopLevelCategories(categories, query), [categories, query]);

  function toggleExpanded(id: number) {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const [selectedCategory, setSelectedCategory] = React.useState<CategoryNode | null>(null);
  const [manageTarget, setManageTarget] = React.useState<ManageTarget>({
    mode: 'create',
    category: null,
    parentId: null,
    key: 0,
  });
  const [deletingCategory, setDeletingCategory] = React.useState<CategoryNode | null>(null);

  const detailModal = useModal();
  const linkProductModal = useModal();
  const manageModal = useModal();
  const confirmModal = useModal();

  function openDetail(category: CategoryNode) {
    setSelectedCategory(category);
    detailModal.present();
  }
  function openCreate() {
    setManageTarget((prev) => ({ mode: 'create', category: null, parentId: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(category: CategoryNode) {
    setManageTarget((prev) => ({ mode: 'edit', category, parentId: null, key: prev.key + 1 }));
    detailModal.dismiss();
    manageModal.present();
  }
  function openAddSubcategory(parentId: number) {
    setManageTarget((prev) => ({ mode: 'addSub', category: null, parentId, key: prev.key + 1 }));
    detailModal.dismiss();
    manageModal.present();
  }
  function openLinkProducts(category: CategoryNode) {
    setSelectedCategory(category);
    detailModal.dismiss();
    linkProductModal.present();
  }
  function openDelete(category: CategoryNode) {
    setDeletingCategory(category);
    detailModal.dismiss();
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingCategory) return;
    deleteCategory.mutate(
      { id: deletingCategory.id, parent: deletingCategory.parent },
      {
        onSuccess: () => {
          confirmModal.dismiss();
          setDeletingCategory(null);
        },
      }
    );
  }

  const renderItem = React.useCallback(
    ({ item }: { item: CategoryNode }) => (
      <CategoryTreeRow
        colors={colors}
        category={item}
        level={0}
        expandedMap={expandedMap}
        toggleExpanded={toggleExpanded}
        onSelect={openDetail}
      />
    ),
    [colors, expandedMap]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Type at least 3 characters to search…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
            editable={!categoriesQuery.isLoading}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add</Text>
        </Pressable>
      </View>

      {categoriesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading categories…</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>
            {query.trim().length >= 3 ? 'No items matching your search' : 'No categories to show'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <CategoryDetailSheet
        ref={detailModal.ref}
        colors={colors}
        category={selectedCategory}
        onEdit={openEdit}
        onAddSubcategory={openAddSubcategory}
        onDelete={openDelete}
        onLinkProducts={openLinkProducts}
      />
      <LinkProductSheet ref={linkProductModal.ref} colors={colors} category={selectedCategory} onDone={() => linkProductModal.dismiss()} />
      <ManageCategoryModal
        ref={manageModal.ref}
        colors={colors}
        mode={manageTarget.mode}
        category={manageTarget.category}
        parentId={manageTarget.parentId}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title={deletingCategory?.parent ? 'Delete subcategory?' : 'Delete category?'}
        description={deletingCategory ? `"${deletingCategory.name}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteCategory.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 42, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
