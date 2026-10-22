import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useModal, PressableScale } from '@/components/ui';

import { CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Item = { id: number; label: string };

type Props = {
  colors: CmsThemeColors;
  label: string;
  items: Item[];
  value: number[];
  onChange: (value: number[]) => void;
};

/** Generic checkbox-list-in-a-CmsModal multi-select — same recipe as
 * Discounts' `ScopedItemsMultiSelect` and Products' `CategoryMultiSelect`.
 * Third consumer of this pattern; still not worth promoting into the shared
 * kit for the same reason `CategoryMultiSelect`'s own comment gives. */
export function GroupsPermissionsMultiSelect({ colors, label, items, value, onChange }: Props) {
  const modal = useModal();
  const selectedLabels = items.filter((i) => value.includes(i.id)).map((i) => i.label);

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <PressableScale scaleTo={0.98} onPress={modal.present} style={[st.field, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Text style={[st.value, { color: selectedLabels.length ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
          {selectedLabels.length ? selectedLabels.join(', ') : `Select ${label.toLowerCase()}…`}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </PressableScale>

      <CmsModal ref={modal.ref} colors={colors} title={label} snapPoints={['70%']}>
        <BottomSheetFlatList
          data={items}
          keyExtractor={(item) => `${label}-${item.id}`}
          renderItem={({ item }) => {
            const checked = value.includes(item.id);
            return (
              <PressableScale
                scaleTo={0.98}
                onPress={() => toggle(item.id)}
                style={[st.option, { borderColor: colors.border }]}
              >
                <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? colors.accent : colors.textSecondary} />
              </PressableScale>
            );
          }}
          ListEmptyComponent={<Text style={{ color: colors.textSecondary, padding: 16 }}>None defined.</Text>}
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
