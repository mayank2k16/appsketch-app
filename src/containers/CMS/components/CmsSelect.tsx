import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useModal } from '@/components/ui';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { CmsModal } from './CmsModal';

export type CmsSelectOption = { label: string; value: string | number };

type Props = {
  colors: CmsThemeColors;
  label: string;
  value?: string | number;
  options: CmsSelectOption[];
  onSelect: (value: string | number) => void;
  placeholder?: string;
  error?: string;
};

/** Plain dropdown picker for CMS forms — opens a `CmsModal` list of options.
 * For search-as-you-type pickers (customer/product lookups), CMS keeps using
 * `@/components/ui`'s `SearchableSelect` instead of rebuilding that behavior
 * here. */
export function CmsSelect({ colors, label, value, options, onSelect, placeholder = 'Select…', error }: Props) {
  const modal = useModal();
  const selectedLabel = options.find((o) => o.value === value)?.label;
  const height = Math.min(options.length * 52 + 90, 420);

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={modal.present}
        style={[st.field, { backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border }]}
      >
        <Text style={[st.value, { color: selectedLabel ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={[st.error, { color: colors.danger }]}>{error}</Text> : null}

      <CmsModal ref={modal.ref} colors={colors} title={label} snapPoints={[height]}>
        <BottomSheetFlatList
          data={options}
          keyExtractor={(item) => `cms-select-${item.value}`}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item.value);
                modal.dismiss();
              }}
              style={[st.option, { borderColor: colors.border }]}
            >
              <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              {item.value === value ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
            </Pressable>
          )}
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
  value: cmsType.inputValue,
  error: cmsType.inputError,
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
