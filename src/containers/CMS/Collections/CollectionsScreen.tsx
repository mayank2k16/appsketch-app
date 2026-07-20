import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CollectionItem } from '@/api/collections';
import { useCollections, useDeleteCollection } from '@/api/collections';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { CollectionCard } from './components/CollectionCard';
import { ManageCollectionModal } from './components/ManageCollectionModal';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CollectionsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const collectionsQuery = useCollections();
  const deleteCollection = useDeleteCollection();
  const collections = collectionsQuery.data ?? [];

  const visible = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return collections.filter((c) => c.title?.toLowerCase().includes(q));
  }, [collections, debouncedQuery]);

  const [manageTarget, setManageTarget] = React.useState<{ collection: CollectionItem | null; key: number }>({
    collection: null,
    key: 0,
  });
  const [deletingCollection, setDeletingCollection] = React.useState<CollectionItem | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ collection: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(collection: CollectionItem) {
    setManageTarget((prev) => ({ collection, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(collection: CollectionItem) {
    setDeletingCollection(collection);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingCollection) return;
    deleteCollection.mutate(deletingCollection.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingCollection(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: CollectionItem }) => (
      <CollectionCard collection={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search collections…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add</Text>
        </Pressable>
      </View>

      {collectionsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading collections…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={st.center}>
          <Text style={st.emptyIcon}>🗂️</Text>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No collections yet</Text>
          <Text style={[st.emptySubtitle, { color: colors.textSecondary }]}>
            Group products into a collection — Top Seller, Best Seller, Today's Special — and it'll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <ManageCollectionModal
        ref={manageModal.ref}
        colors={colors}
        collection={manageTarget.collection}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete this collection?"
        description={deletingCollection ? `"${deletingCollection.title}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteCollection.isPending}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySubtitle: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
});
