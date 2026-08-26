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

// Tree-connector geometry — one indent step per depth level, matching the
// row's own `(depth + 0.7) * TREE_STEP` indent so connector columns line up
// under the card's left edge at every level.
const TREE_STEP = 18;
const TREE_LINE_WIDTH = 1.5;
const TREE_TICK_Y = 25; // vertical center of the 50pt card
const TREE_TICK_WIDTH = 14;

type Props = {
  colors: CmsThemeColors;
  category: CategoryNode;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  ancestorLines: boolean[];
  isLastInGroup: boolean;
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
  ancestorLines,
  isLastInGroup,
  onToggle,
  onSelect,
}: Props) {
  const imageUri = resolveMediaUrl(category.image);

  return (
    <View style={{ height: CATEGORY_ROW_HEIGHT, marginHorizontal: 14 }}>
      {depth > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Passthrough bars for every ancestor level above the immediate
           * parent — only drawn while that ancestor still has a later
           * sibling waiting below. */}
          {ancestorLines.slice(0, depth - 1).map((continues, i) =>
            continues ? (
              <View
                key={i}
                style={[
                  st.treeLine,
                  { left: (i + 0.7) * TREE_STEP, top: 0, height: CATEGORY_ROW_HEIGHT, backgroundColor: colors.accent, opacity: 0.4 },
                ]}
              />
            ) : null
          )}
          {/* Elbow connecting this row to its immediate parent/siblings. */}
          <View
            style={[
              st.treeLine,
              { left: (depth - 1 + 0.7) * TREE_STEP, top: 0, height: TREE_TICK_Y, backgroundColor: colors.accent, opacity: 0.4 },
            ]}
          />
          {!isLastInGroup && (
            <View
              style={[
                st.treeLine,
                {
                  left: (depth - 1 + 0.7) * TREE_STEP,
                  top: TREE_TICK_Y,
                  height: CATEGORY_ROW_HEIGHT - TREE_TICK_Y,
                  backgroundColor: colors.accent,
                  opacity: 0.4,
                },
              ]}
            />
          )}
          <View
            style={[
              st.treeTick,
              {
                left: (depth - 1 + 0.7) * TREE_STEP,
                top: TREE_TICK_Y - TREE_LINE_WIDTH / 2,
                backgroundColor: colors.accent,
                opacity: 0.4,
              },
            ]}
          />
        </View>
      )}

      <Pressable
        onPress={() => onSelect(category)}
        style={[
          st.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            // Root rows sit flush with the wrapper's own edges (symmetric
            // left/right inset). Only deeper levels step in to make room for
            // the tree connector gutter, matching the elbow's own column math.
            marginLeft: depth === 0 ? 0 : (depth + 0.7) * TREE_STEP,
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
          name="create-outline"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
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
  treeLine: { position: 'absolute', width: TREE_LINE_WIDTH, borderRadius: 1 },
  treeTick: { position: 'absolute', height: TREE_LINE_WIDTH, width: TREE_TICK_WIDTH, borderRadius: 1 },
});
