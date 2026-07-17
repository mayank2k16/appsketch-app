import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useModal } from '@/components/ui';

import { CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props<T> = {
  colors: CmsThemeColors;
  label: string;
  items: T[];
  loading?: boolean;
  getId: (item: T) => string | number;
  getLabel: (item: T) => string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  disabled?: boolean;
};

/** Generic checkbox-list-in-a-`CmsModal` multi-select — same recipe as
 * `Products/components/CategoryMultiSelect.tsx` (whose own comment notes
 * it's a single-tab-only copy, not promoted into the shared kit). This is
 * the second consumer, so it gets its own generic copy here rather than
 * forcing a premature kit abstraction on two data points. */
export function ScopedItemsMultiSelect<T>({
  colors,
  label,
  items,
  loading,
  getId,
  getLabel,
  value,
  onChange,
  disabled,
}: Props<T>) {
  const modal = useModal();
  const selectedLabels = items.filter((item) => value.includes(getId(item))).map(getLabel);

  function toggle(id: string | number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={disabled ? undefined : modal.present}
        style={[
          st.field,
          { backgroundColor: colors.background, borderColor: colors.border },
          disabled && st.disabled,
        ]}
      >
        <Text
          style={[st.value, { color: selectedLabels.length ? colors.textPrimary : colors.textSecondary }]}
          numberOfLines={1}
        >
          {disabled ? 'Applies to all' : selectedLabels.length ? selectedLabels.join(', ') : 'Select items…'}
        </Text>
        {!disabled ? <Ionicons name="chevron-down" size={16} color={colors.textSecondary} /> : null}
      </Pressable>

      <CmsModal ref={modal.ref} colors={colors} title={label} snapPoints={['70%']}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} size="small" color={colors.accent} />
        ) : (
          <BottomSheetFlatList
            data={items}
            keyExtractor={(item) => `scoped-item-${getId(item)}`}
            renderItem={({ item }) => {
              const id = getId(item);
              const checked = value.includes(id);
              return (
                <Pressable onPress={() => toggle(id)} style={[st.option, { borderColor: colors.border }]}>
                  <Text style={[st.optionLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {getLabel(item)}
                  </Text>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? colors.accent : colors.textSecondary}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={{ color: colors.textSecondary, padding: 16 }}>No items available.</Text>}
          />
        )}
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
  disabled: { opacity: 0.5 },
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
