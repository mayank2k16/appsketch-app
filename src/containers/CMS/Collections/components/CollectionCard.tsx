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
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 110 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 12, gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { ...cmsType.listTitle, flex: 1 },
  count: cmsType.listMeta,
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionLabel: cmsType.buttonLabel,
});
