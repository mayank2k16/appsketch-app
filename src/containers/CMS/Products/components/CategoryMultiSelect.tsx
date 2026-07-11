import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductCategory } from '@/api/products';
import { useModal } from '@/components/ui';

import { CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  categories: ProductCategory[];
  value: number[];
  onChange: (value: number[]) => void;
};

/** Leaf-category multi-select — the kit's `CmsSelect` only supports a
 * single value, so this tab gets its own checkbox-list modal instead of
 * extending the shared kit for a need only Products has so far. */
export function CategoryMultiSelect({ colors, label, categories, value, onChange }: Props) {
  const modal = useModal();
  const selectedLabels = categories.filter((c) => value.includes(c.id)).map((c) => c.name);

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={modal.present}
        style={[st.field, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        <Text
          style={[st.value, { color: selectedLabels.length ? colors.textPrimary : colors.textSecondary }]}
          numberOfLines={1}
        >
          {selectedLabels.length ? selectedLabels.join(', ') : 'Select category…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <CmsModal ref={modal.ref} colors={colors} title={label} snapPoints={['70%']}>
        <BottomSheetFlatList
          data={categories}
          keyExtractor={(item) => `category-${item.id}`}
          renderItem={({ item }) => {
            const checked = value.includes(item.id);
            return (
              <Pressable onPress={() => toggle(item.id)} style={[st.option, { borderColor: colors.border }]}>
                <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{item.name}</Text>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? colors.accent : colors.textSecondary}
                />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, padding: 16 }}>No categories available.</Text>
          }
        />
      </CmsModal>
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: { ...cmsType.inputValue, flex: 1, marginRight: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: cmsType.inputValue,
});
