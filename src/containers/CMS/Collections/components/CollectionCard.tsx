import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CollectionItem } from '@/api/collections';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  collection: CollectionItem;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
};

export const CollectionCard = React.memo(function CollectionCard({ collection, colors, onEdit, onDelete }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {collection.image ? (
        <Image source={{ uri: collection.image }} style={st.image} contentFit="cover" />
      ) : (
        <View style={[st.image, st.imagePlaceholder, { backgroundColor: colors.background }]}>
          <Ionicons name="albums-outline" size={22} color={colors.textSecondary} />
        </View>
      )}

      <View style={st.body}>
        <View style={st.headerRow}>
          <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {collection.title}
          </Text>
          <CmsStatusBadge
            meta={
              collection.active
                ? { label: 'Active', color: colors.success, kind: 'success' }
                : { label: 'Inactive', color: colors.textSecondary, kind: 'info' }
            }
          />
        </View>

        {collection.description ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }} numberOfLines={2}>
            {collection.description}
          </Text>
        ) : null}

        <Text style={[st.count, { color: colors.textSecondary }]}>
          {collection.products_count ?? collection.products?.length ?? 0} products
        </Text>

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
  image: { width: 96 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, gap: 0, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { ...cmsType.listTitle, flex: 1 },
  count: cmsType.listMeta,
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  actionLabel: cmsType.buttonLabel,
});
