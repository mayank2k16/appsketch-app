import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { InvoiceFilters, InvoiceListItem } from '@/api/invoices';
import { searchInvoiceRecords, useDeleteInvoice, useInvoices } from '@/api/invoices';
import { ConfirmModal, useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../theme';
import { FilterModal } from './components/FilterModal';
import { InvoiceListCard } from './components/InvoiceListCard';
import { ManageInvoiceModal } from './components/ManageInvoiceModal';

const EMPTY_FILTERS: InvoiceFilters = { entity: [], type: [], startDate: '', endDate: '' };

function applyFilters(invoices: InvoiceListItem[], filters: InvoiceFilters): InvoiceListItem[] {
  if (!filters.entity?.length && !filters.type?.length && !filters.startDate && !filters.endDate) {
    return invoices;
  }
  return invoices.filter((invoice) => {
    if (filters.entity?.length) {
      const entityIds = filters.entity.map((id) => Number(id));
      if (!entityIds.includes(Number(invoice.entity))) return false;
    }
    if (filters.type?.length && !filters.type.includes(String(invoice.type))) return false;
    if (filters.startDate || filters.endDate) {
      const invoiceDate = new Date(invoice.created_on);
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (invoiceDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (invoiceDate > end) return false;
      }
    }
    return true;
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function InvoicesScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const isSearching = debouncedQuery.length > 2;

  const [searchResults, setSearchResults] = React.useState<InvoiceListItem[] | null>(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<InvoiceFilters>(EMPTY_FILTERS);

  const invoicesQuery = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const pagedInvoices = React.useMemo(() => invoicesQuery.data?.pages.flat() ?? [], [invoicesQuery.data]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isSearching) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    searchInvoiceRecords(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSearching]);

  const baseList = isSearching ? (searchResults ?? []) : pagedInvoices;
  const invoices = React.useMemo(() => applyFilters(baseList, filters), [baseList, filters]);
  const loading = isSearching ? searchLoading : invoicesQuery.isLoading;

  const [manageTarget, setManageTarget] = React.useState<{ id: number | null; key: number }>({ id: null, key: 0 });
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const manageModal = useModal();
  const filterModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ id: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(id: number) {
    setManageTarget((prev) => ({ id, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(id: number) {
    setDeletingId(id);
    confirmModal.present();
  }
  function confirmDelete() {
    if (deletingId === null) return;
    deleteInvoice.mutate(deletingId, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingId(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: InvoiceListItem }) => (
      <InvoiceListCard invoice={item} colors={colors} onEdit={() => openEdit(item.id)} onDelete={() => openDelete(item.id)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search invoices by invoice ID…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={filterModal.present} style={[st.iconBtn, { borderColor: colors.border }]}>
          <Ionicons name="filter-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={st.actionsRow}>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Generate Invoice</Text>
        </Pressable>
      </View>

      {loading && invoices.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading invoices…</Text>
        </View>
      ) : invoices.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No Invoices Found.</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!isSearching && invoicesQuery.hasNextPage && !invoicesQuery.isFetchingNextPage) {
              invoicesQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            !isSearching && invoicesQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      <FilterModal ref={filterModal.ref} colors={colors} filters={filters} onApply={(f) => { setFilters(f); filterModal.dismiss(); }} />
      <ManageInvoiceModal
        ref={manageModal.ref}
        colors={colors}
        invoiceId={manageTarget.id}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete invoice?"
        description="This invoice will be permanently deleted."
        confirmLabel="Delete"
        destructive
        loading={deleteInvoice.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  iconBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 10, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
