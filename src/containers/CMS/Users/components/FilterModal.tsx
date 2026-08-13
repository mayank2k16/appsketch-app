import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { UsersStatusFilter } from '@/api/users';

import { CmsButton, CmsCard, CmsModal, CmsSheetScrollView } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { STATUS_OPTS } from '../utils';

export type UsersFilters = {
  role: string;
  status: UsersStatusFilter;
};

const EMPTY_FILTERS: UsersFilters = { role: '', status: 'active' };

type RoleOption = { value: string; label: string };

type Props = {
  colors: CmsThemeColors;
  roles: RoleOption[];
  filters: UsersFilters;
  onApply: (filters: UsersFilters) => void;
};

/** Role and status are both single-select (the screen only ever tracks one
 * of each at a time), so rows use a radio glyph rather than the checkbox
 * multi-select `FilterModal.tsx` in Invoices uses for its list filters. */
export const FilterModal = React.forwardRef<BottomSheetModal, Props>(({ colors, roles, filters, onApply }, ref) => {
  const [temp, setTemp] = React.useState<UsersFilters>(filters);

  React.useEffect(() => {
    setTemp(filters);
  }, [filters]);

  function handleApply() {
    onApply(temp);
  }

  function handleClear() {
    setTemp(EMPTY_FILTERS);
  }

  return (
    <CmsModal
      ref={ref}
      colors={colors}
      snapPoints={['70%']}
      title="Filter Users"
      footer={
        <View style={st.footer}>
          <CmsButton colors={colors} label="Clear All" variant="ghost" onPress={handleClear} style={{ flex: 1 }} />
          <CmsButton colors={colors} label="Apply Filters" onPress={handleApply} style={{ flex: 1 }} />
        </View>
      }
    >
      <CmsSheetScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={st.scroll}>
        <CmsCard colors={colors} title="Filter by Role">
          <FilterRow
            colors={colors}
            label="All roles"
            active={!temp.role}
            onPress={() => setTemp((prev) => ({ ...prev, role: '' }))}
          />
          {roles.map((r) => (
            <FilterRow
              key={r.value}
              colors={colors}
              label={r.label}
              active={temp.role === r.value}
              onPress={() => setTemp((prev) => ({ ...prev, role: r.value }))}
            />
          ))}
        </CmsCard>

        <CmsCard colors={colors} title="Filter by Status">
          {STATUS_OPTS.map((s) => (
            <FilterRow
              key={s.value}
              colors={colors}
              label={s.label}
              active={temp.status === s.value}
              onPress={() => setTemp((prev) => ({ ...prev, status: s.value }))}
            />
          ))}
        </CmsCard>
      </CmsSheetScrollView>
    </CmsModal>
  );
});

function FilterRow({
  colors,
  label,
  active,
  onPress,
}: {
  colors: CmsThemeColors;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[st.row, { borderColor: colors.border }]}>
      <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }}>{label}</Text>
      <Ionicons
        name={active ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={active ? colors.accent : colors.textSecondary}
      />
    </Pressable>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: { flexDirection: 'row', gap: 10 },
});
