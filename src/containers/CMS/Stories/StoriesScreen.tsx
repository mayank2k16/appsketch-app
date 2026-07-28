import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { StoryItem } from '@/api/stories';
import { useDeleteStory, useStories } from '@/api/stories';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { ManageStoryModal } from './components/ManageStoryModal';
import { StoryCard } from './components/StoryCard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StoriesScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const storiesQuery = useStories();
  const deleteStory = useDeleteStory();
  const stories = storiesQuery.data ?? [];

  const visible = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return stories.filter((s) => s.title?.toLowerCase().includes(q));
  }, [stories, debouncedQuery]);

  const [manageTarget, setManageTarget] = React.useState<{ story: StoryItem | null; key: number }>({
    story: null,
    key: 0,
  });
  const [deletingStory, setDeletingStory] = React.useState<StoryItem | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ story: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(story: StoryItem) {
    setManageTarget((prev) => ({ story, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(story: StoryItem) {
    setDeletingStory(story);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingStory) return;
    deleteStory.mutate(deletingStory.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingStory(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: StoryItem }) => (
      <StoryCard story={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
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
            placeholder="Search stories…"
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

      {storiesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading stories…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={st.center}>
          <Text style={st.emptyIcon}>📖</Text>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No stories yet</Text>
          <Text style={[st.emptySubtitle, { color: colors.textSecondary }]}>
            Add a story — mark one as Featured to power the app's home hero, the rest show in the "Today's Fresh Story" rail.
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

      <ManageStoryModal
        ref={manageModal.ref}
        colors={colors}
        story={manageTarget.story}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete this story?"
        description={deletingStory ? `"${deletingStory.title}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteStory.isPending}
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
