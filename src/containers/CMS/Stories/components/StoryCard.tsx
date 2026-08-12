import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { StoryItem } from '@/api/stories';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  story: StoryItem;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
};

export const StoryCard = React.memo(function StoryCard({ story, colors, onEdit, onDelete }: Props) {
  const imageUri = story.thumbnailUrl ?? story.imageUrl;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={st.image} contentFit="cover" />
      ) : (
        <View style={[st.image, st.imagePlaceholder, { backgroundColor: colors.background }]}>
          <Ionicons name="book-outline" size={22} color={colors.textSecondary} />
        </View>
      )}

      <View style={st.body}>
        <View style={st.badgeRow}>
          {story.is_featured ? (
            <CmsStatusBadge meta={{ label: '★ Featured', color: '#8a6d00', kind: 'warning' }} />
          ) : null}
          <CmsStatusBadge
            meta={
              story.is_active
                ? { label: 'Active', color: colors.success, kind: 'success' }
                : { label: 'Hidden', color: colors.textSecondary, kind: 'info' }
            }
          />
        </View>

        <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {story.title}
        </Text>
        {story.timestamp_label ? (
          <Text style={[st.timestamp, { color: colors.textSecondary }]} numberOfLines={1}>
            {story.timestamp_label}
          </Text>
        ) : null}

        <View style={st.actions}>
          <Pressable onPress={onEdit} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
            <Text style={[st.actionLabel, { color: colors.textPrimary }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[st.actionLabel, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  // No explicit height: the row's default `alignItems: 'stretch'` grows the
  // image to match `body`'s content height instead, so it fills the card's
  // left edge exactly regardless of how much text the card holds.
  image: { width: 100 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, gap: 0, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  title: { ...cmsType.listTitle },
  timestamp: { fontSize: 11.5 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  actionLabel: cmsType.buttonLabel,
});
