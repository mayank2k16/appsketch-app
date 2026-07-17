import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { InvoiceFilters } from '@/api/invoices';
import { useAllEntities } from '@/api/invoices';

import { CmsButton, CmsCard, CmsInput, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';

// Kept literal to Vite's `FilterModal.jsx` — these values don't line up with
// the invoice types the create form actually produces (PROFORMA/GENERAL/
// CONTRACTOR), but that mismatch already exists in the reference and this is
// a straight port of a real, reachable filter, not a fix-up.
const TYPE_OPTIONS = [
  { label: 'Sales', value: 'SALE' },
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Performa', value: 'PERFORMA' },
];

const EMPTY_FILTERS: InvoiceFilters = { entity: [], type: [], startDate: '', endDate: '' };

type Props = {
  colors: CmsThemeColors;
  filters: InvoiceFilters;
  onApply: (filters: InvoiceFilters) => void;
};

export const FilterModal = React.forwardRef<BottomSheetModal, Props>(({ colors, filters, onApply }, ref) => {
  const [temp, setTemp] = React.useState<InvoiceFilters>(filters);
  const entitiesQuery = useAllEntities();
  const entities = entitiesQuery.data ?? [];

  React.useEffect(() => {
    setTemp(filters);
  }, [filters]);

  function toggle(key: 'entity' | 'type', value: string | number) {
    setTemp((prev) => {
      const list = (prev[key] ?? []) as (string | number)[];
      const exists = list.includes(value);
      return {
        ...prev,
        [key]: exists ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function handleApply() {
    onApply(temp);
  }

  function handleClear() {
    setTemp(EMPTY_FILTERS);
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title="Filter Invoices">
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      >
        <CmsCard colors={colors} title="Filter by Party">
          {entitiesQuery.isLoading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading parties…</Text>
          ) : entities.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No parties found.</Text>
          ) : (
            entities.map((entity) => {
              const checked = (temp.entity ?? []).includes(entity.id);
              return (
                <Pressable
                  key={entity.id}
                  onPress={() => toggle('entity', entity.id)}
                  style={[st.row, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {entity.title}
                  </Text>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? colors.accent : colors.textSecondary}
                  />
                </Pressable>
              );
            })
          )}
        </CmsCard>

        <CmsCard colors={colors} title="Filter by Type">
          {TYPE_OPTIONS.map((opt) => {
            const checked = (temp.type ?? []).includes(opt.value);
            return (
              <Pressable
                key={opt.value}
                onPress={() => toggle('type', opt.value)}
                style={[st.row, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }}>{opt.label}</Text>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? colors.accent : colors.textSecondary}
                />
              </Pressable>
            );
          })}
        </CmsCard>

        <CmsCard colors={colors} title="Date Range">
          <CmsInput
            colors={colors}
            label="Start Date (YYYY-MM-DD)"
            value={temp.startDate}
            onChangeText={(v) => setTemp((prev) => ({ ...prev, startDate: v }))}
          />
          <CmsInput
            colors={colors}
            label="End Date (YYYY-MM-DD)"
            value={temp.endDate}
            onChangeText={(v) => setTemp((prev) => ({ ...prev, endDate: v }))}
          />
        </CmsCard>

        <View style={st.footer}>
          <CmsButton colors={colors} label="Clear All" variant="ghost" onPress={handleClear} style={{ flex: 1 }} />
          <CmsButton colors={colors} label="Apply Filters" onPress={handleApply} style={{ flex: 1 }} />
        </View>
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: { flexDirection: 'row', gap: 10 },
});
