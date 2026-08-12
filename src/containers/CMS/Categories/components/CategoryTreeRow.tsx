import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CategoryNode } from '@/api/categories';
import { resolveMediaUrl } from '@/lib/media-url';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

// Fixed row height (content height + bottom margin) that the drag math and
// FlatList's `getItemLayout` both depend on: a sibling group is only a
// uniform run of `CATEGORY_ROW_HEIGHT`-tall steps once every row — including
// the two-line "N subcategories" case — is pinned to the same height.
export const CATEGORY_ROW_HEIGHT = 58; // 50 row + 8 marginBottom

type Props = {
  colors: CmsThemeColors;
  category: CategoryNode;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: (id: number) => void;
  onSelect: (category: CategoryNode) => void;
};

/** Purely presentational — no longer recurses into `sub_categories`. The
 * screen flattens the visible tree (see `utils.ts#flattenVisible`) and
 * renders one row per visible node so the list can be a single FlatList
 * (required for both virtualization and the drag-to-reorder gesture). */
export function CategoryTreeRow({
  colors,
  category,
  depth,
  hasChildren,
  expanded,
  onToggle,
  onSelect,
}: Props) {
  const imageUri = resolveMediaUrl(category.image);
  console.log(imageUri, category.image);

  return (
    <Pressable
      onPress={() => onSelect(category)}
      style={[
        st.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginLeft: (depth + 0.7) * 18,
        },
      ]}
    >
      {hasChildren && (
        <Pressable
          onPress={() => onToggle(category.id)}
          hitSlop={8}
          style={st.chevron}
        >
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
      )}

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={st.thumb}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            st.thumb,
            st.thumbPlaceholder,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="folder-outline"
            size={16}
            color={colors.textSecondary}
          />
        </View>
      )}

      {category.colour ? (
        <View style={[st.swatch, { backgroundColor: category.colour }]} />
      ) : null}

      <View style={{ flex: 1 }}>
        <Text
          style={[st.name, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        {hasChildren ? (
          <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {category.sub_categories.length} subcategor
            {category.sub_categories.length === 1 ? 'y' : 'ies'}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 10,
    marginHorizontal: 14,
    marginBottom: 8,
  },
  chevron: { width: 16, alignItems: 'center' },
  thumb: { width: 32, height: 32, borderRadius: 5 },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  name: cmsType.listTitle,
  meta: cmsType.listMeta,
});
