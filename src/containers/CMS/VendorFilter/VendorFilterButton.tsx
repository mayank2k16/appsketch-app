import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useVendors } from '@/api/vendors';
import type { VendorListItem } from '@/api/vendors';
import { useModal } from '@/components/ui/modal';
import { useStudio } from '@/lib/store/studio-store';
import { useVendorFilter } from '@/lib/store/vendor-filter-store';

import { CmsModal } from '../components';
import { useCmsTheme } from '../theme';

const SHEET_HEIGHT = 520;

export function VendorFilterButton() {
  const { colors } = useCmsTheme();
  const modal = useModal();
  const selectedVendor = useVendorFilter.use.selectedVendor();

  return (
    <>
      <Pressable
        onPress={modal.present}
        style={[st.trigger, { backgroundColor: colors.sidebarActiveBg }]}
        hitSlop={8}
        accessibilityLabel="Filter by vendor"
      >
        <Ionicons
          name={selectedVendor ? 'business' : 'business-outline'}
          size={18}
          color={selectedVendor ? colors.accent : colors.sidebarText}
        />
      </Pressable>
      <VendorFilterSheet ref={modal.ref} onSelect={modal.dismiss} />
    </>
  );
}

const VendorFilterSheet = React.forwardRef<BottomSheetModal, { onSelect: () => void }>(
  ({ onSelect }, ref) => {
    const { colors } = useCmsTheme();
    const vendorsQuery = useVendors();
    const attachedTenant = useStudio.use.attachedTenant();
    const selectedVendor = useVendorFilter.use.selectedVendor();
    const setSelectedVendor = useVendorFilter.use.setSelectedVendor();
    const [query, setQuery] = React.useState('');

    // The marketplace tenant itself sells under its own tenant id, same as
    // any vendor, but `useVendors()` only returns onboarded sub-vendors, so
    // the parent tenant never shows up there. Synthesize the same entry here
    // from the attached tenant so "filter to just my own listings" is
    // possible too.
    const selfVendor: VendorListItem | null = React.useMemo(() => {
      if (!attachedTenant) return null;
      const id = Number(attachedTenant.id);
      if (!Number.isFinite(id)) return null;
      return { id, title: attachedTenant.title, status: 'approved' };
    }, [attachedTenant]);

    const approvedVendors = React.useMemo(
      () => (vendorsQuery.data ?? []).filter((v) => v.status === 'approved'),
      [vendorsQuery.data]
    );

    const allVendors = React.useMemo(
      () => (selfVendor ? [selfVendor, ...approvedVendors] : approvedVendors),
      [selfVendor, approvedVendors]
    );

    const q = query.trim().toLowerCase();
    const filteredVendors = q ? allVendors.filter((v) => v.title.toLowerCase().includes(q)) : allVendors;

    const snapPoints = React.useMemo(() => [SHEET_HEIGHT], []);

    const choose = React.useCallback(
      (vendor: VendorListItem | null) => {
        setSelectedVendor(vendor);
        onSelect();
      },
      [setSelectedVendor, onSelect]
    );

    return (
      <CmsModal ref={ref} colors={colors} title="Select Vendor" snapPoints={snapPoints}>
        <View style={[st.searchWrap, { borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search vendors…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <BottomSheetFlatList
          data={filteredVendors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={st.sheet}
          ListHeaderComponent={
            !q ? (
              <Pressable
                onPress={() => choose(null)}
                style={[st.row, { borderColor: colors.border }]}
              >
                <Text style={[st.label, { color: colors.textPrimary }]}>All Vendors</Text>
                {!selectedVendor && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => {
            const isSelected = selectedVendor?.id === item.id;
            const isSelf = item.id === selfVendor?.id;
            return (
              <Pressable
                onPress={() => choose(item)}
                style={[st.row, { borderColor: colors.border }]}
              >
                <Text style={[st.label, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                  {isSelf ? ' (You)' : ''}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={[st.empty, { color: colors.textSecondary }]}>
              {vendorsQuery.isLoading
                ? 'Loading vendors…'
                : q
                  ? 'No vendors match your search.'
                  : 'No approved vendors yet.'}
            </Text>
          }
        />
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  trigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 38,
  },
  sheet: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
});
