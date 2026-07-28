import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ShortVideoItem } from '@/api/short-videos';
import { useDeleteShortVideo, useShortVideos } from '@/api/short-videos';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { ManageShortVideoModal } from './components/ManageShortVideoModal';
import { ShortVideoCard } from './components/ShortVideoCard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ShortVideosScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const videosQuery = useShortVideos();
  const deleteShortVideo = useDeleteShortVideo();
  const videos = videosQuery.data ?? [];

  const visible = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return videos.filter((v) => v.title?.toLowerCase().includes(q));
  }, [videos, debouncedQuery]);

  const [manageTarget, setManageTarget] = React.useState<{ video: ShortVideoItem | null; key: number }>({
    video: null,
    key: 0,
  });
  const [deletingVideo, setDeletingVideo] = React.useState<ShortVideoItem | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ video: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(video: ShortVideoItem) {
    setManageTarget((prev) => ({ video, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(video: ShortVideoItem) {
    setDeletingVideo(video);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingVideo) return;
    deleteShortVideo.mutate(deletingVideo.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingVideo(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: ShortVideoItem }) => (
      <ShortVideoCard video={item} colors={colors} onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
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
            placeholder="Search short videos…"
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

      {videosQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading short videos…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={st.center}>
          <Text style={st.emptyIcon}>🎬</Text>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No short videos yet</Text>
          <Text style={[st.emptySubtitle, { color: colors.textSecondary }]}>
            Add a vertical (9:16) video — active videos inside their date window show in the app's Today's Fresh Stories rail, tappable like Instagram stories.
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

      <ManageShortVideoModal
        ref={manageModal.ref}
        colors={colors}
        video={manageTarget.video}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete this short video?"
        description={deletingVideo ? `"${deletingVideo.title}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteShortVideo.isPending}
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
