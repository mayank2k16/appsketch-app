import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryNode } from '@/api/categories';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  category: CategoryNode;
  level: number;
  expandedMap: Record<number, boolean>;
  toggleExpanded: (id: number) => void;
  onSelect: (category: CategoryNode) => void;
};

export function CategoryTreeRow({ colors, category, level, expandedMap, toggleExpanded, onSelect }: Props) {
  const hasChildren = (category.sub_categories?.length ?? 0) > 0;
  const expanded = !!expandedMap[category.id];

  return (
    <View>
      <Pressable
        onPress={() => onSelect(category)}
        style={[
          st.row,
          { backgroundColor: colors.surface, borderColor: colors.border, marginLeft: level * 18 },
        ]}
      >
        <Pressable
          onPress={() => hasChildren && toggleExpanded(category.id)}
          hitSlop={8}
          style={st.chevron}
        >
          {hasChildren ? (
            <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textSecondary} />
          ) : null}
        </Pressable>

        {category.image ? (
          <Image source={{ uri: category.image }} style={st.thumb} contentFit="cover" />
        ) : (
          <View style={[st.thumb, st.thumbPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
          </View>
        )}

        {category.colour ? <View style={[st.swatch, { backgroundColor: category.colour }]} /> : null}

        <View style={{ flex: 1 }}>
          <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {category.name}
          </Text>
          {hasChildren ? (
            <Text style={[st.meta, { color: colors.textSecondary }]}>
              {category.sub_categories.length} subcategor{category.sub_categories.length === 1 ? 'y' : 'ies'}
            </Text>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </Pressable>

      {hasChildren && expanded
        ? category.sub_categories.map((sub) => (
            <CategoryTreeRow
              key={sub.id}
              colors={colors}
              category={sub}
              level={level + 1}
              expandedMap={expandedMap}
              toggleExpanded={toggleExpanded}
              onSelect={onSelect}
            />
          ))
        : null}
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  chevron: { width: 16, alignItems: 'center' },
  thumb: { width: 32, height: 32, borderRadius: 8 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  name: cmsType.listTitle,
  meta: cmsType.listMeta,
});
