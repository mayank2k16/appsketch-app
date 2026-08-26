import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryNode } from '@/api/categories';
import { useCategoryTree, useDeleteCategoryAtAnyLevel, useReorderCategories } from '@/api/categories';
import { useModal } from '@/components/ui';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { CategoriesSkeleton } from './components/CategoriesSkeleton';
import { CategoryDetailSheet } from './components/CategoryDetailSheet';
import { CATEGORY_ROW_HEIGHT } from './components/CategoryTreeRow';
import { DraggableCategoryRow } from './components/DraggableCategoryRow';
import { LinkProductSheet } from './components/LinkProductSheet';
import { ManageCategoryModal } from './components/ManageCategoryModal';
import {
  filterTopLevelCategories,
  findCategoryById,
  flattenVisible,
  moveWithinParent,
  siblingIdsOf,
  type FlatCategoryRow,
} from './utils';

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
  const [dragScrollEnabled, setDragScrollEnabled] = React.useState(true);

  const categoriesQuery = useCategoryTree();
  const deleteCategory = useDeleteCategoryAtAnyLevel();
  const reorderCategories = useReorderCategories();
  const categories = categoriesQuery.data ?? [];
  const filteredCategories = React.useMemo(() => filterTopLevelCategories(categories, query), [categories, query]);

  // Reordering is disabled while a search filter narrows the list: the
  // visible rows are then a subset, so writing 0..n-1 over them would
  // renumber the filtered rows and silently push hidden siblings to the
  // back. Ported from the web's `reorderEnabled = debouncedQuery.length < 3`.
  const reorderEnabled = query.trim().length < 3;

  const rows = React.useMemo(
    () => flattenVisible(filteredCategories, expandedMap),
    [filteredCategories, expandedMap]
  );

  function toggleExpanded(id: number) {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── drag-and-reorder ─────────────────────────────────────────────────────
  // Only one drag can be in flight at a time, so a single set of shared
  // values (owned here, read by every row) is enough to describe it.
  const activeGroup = useSharedValue('');
  const dragY = useSharedValue(0);
  const fromIndex = useSharedValue(0);
  const toIndex = useSharedValue(0);

  // While a row's sibling group is being dragged, every sibling must be
  // exactly one CATEGORY_ROW_HEIGHT tall for the drag math to line up — so
  // any expanded sibling is collapsed for the duration and restored after.
  const dragStashRef = React.useRef<Record<number, boolean> | null>(null);

  const handleDragStart = React.useCallback(
    (row: FlatCategoryRow) => {
      const siblingIds = siblingIdsOf(categories, row.parentId);
      setExpandedMap((prev) => {
        dragStashRef.current = prev;
        const next = { ...prev };
        siblingIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setDragScrollEnabled(false);
    },
    [categories]
  );

  const handleDragEnd = React.useCallback(
    (row: FlatCategoryRow, from: number, to: number) => {
      setDragScrollEnabled(true);
      const stash = dragStashRef.current;
      dragStashRef.current = null;
      if (stash) setExpandedMap(stash);

      if (from === to) return;
      const nextTree = moveWithinParent(categories, row.parentId, { from, to });
      const ids = siblingIdsOf(nextTree, row.parentId);
      reorderCategories.mutate({ ids, parentId: row.parentId, from, to });
    },
    [categories, reorderCategories]
  );

  // Holds only the id, not the `CategoryNode` object itself — deriving the
  // object fresh from `categories` on every render means any cache update
  // (unlinking a product, reordering, editing) shows up in an open detail
  // sheet immediately, instead of only after it's closed and reopened.
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const selectedCategory = React.useMemo(
    () => findCategoryById(categories, selectedCategoryId),
    [categories, selectedCategoryId]
  );
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
    setSelectedCategoryId(category.id);
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
    setSelectedCategoryId(category.id);
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
    ({ item }: { item: FlatCategoryRow }) => (
      <DraggableCategoryRow
        colors={colors}
        row={item}
        reorderEnabled={reorderEnabled}
        onToggle={toggleExpanded}
        onSelect={openDetail}
        activeGroup={activeGroup}
        dragY={dragY}
        fromIndex={fromIndex}
        toIndex={toIndex}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    ),
    [colors, reorderEnabled, activeGroup, dragY, fromIndex, toIndex, handleDragStart, handleDragEnd]
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
      </View>
      <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
        <Ionicons name="add" size={16} color={colors.accentText} />
        <Text style={[st.addBtnText, { color: colors.accentText }]}>Add Category</Text>
      </Pressable>

      {categoriesQuery.isLoading ? (
        <CategoriesSkeleton colors={colors} />
      ) : filteredCategories.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary, width: '100%', textAlign: 'center' }}>
            {query.trim().length >= 3 ? 'No items matching your search' : 'No categories to show'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => String(row.category.id)}
          renderItem={renderItem}
          scrollEnabled={dragScrollEnabled}
          getItemLayout={(_data, index) => ({
            length: CATEGORY_ROW_HEIGHT,
            offset: CATEGORY_ROW_HEIGHT * index,
            index,
          })}
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
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 38, borderRadius: 8, maxWidth: 200, marginLeft: 'auto', marginRight: 12, marginBottom: 7 },
  addBtnText: { fontSize: 12.5, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
