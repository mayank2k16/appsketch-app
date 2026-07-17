import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DiscountCodeItem } from '@/api/discounts';
import { useDeleteDiscount, useDiscountCodes } from '@/api/discounts';
import { ConfirmModal, useModal } from '@/components/ui';

import { useCmsTheme } from '../theme';
import { DiscountListCard } from './components/DiscountListCard';
import { ManageDiscountModal } from './components/ManageDiscountModal';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DiscountsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');

  const discountsQuery = useDiscountCodes();
  const deleteDiscount = useDeleteDiscount();
  const discounts = discountsQuery.data ?? [];

  const filteredDiscounts = React.useMemo(() => {
    const q = query.toLowerCase();
    const filtered = q
      ? discounts.filter(
          (d) => d.code?.toLowerCase().includes(q) || d.code_description?.toLowerCase().includes(q)
        )
      : discounts;
    return [...filtered].reverse();
  }, [discounts, query]);

  const [manageTarget, setManageTarget] = React.useState<{ discount: DiscountCodeItem | null; key: number }>({
    discount: null,
    key: 0,
  });
  const [deletingDiscount, setDeletingDiscount] = React.useState<DiscountCodeItem | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ discount: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(discount: DiscountCodeItem) {
    setManageTarget((prev) => ({ discount, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(discount: DiscountCodeItem) {
    setDeletingDiscount(discount);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingDiscount) return;
    deleteDiscount.mutate(deletingDiscount.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingDiscount(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: DiscountCodeItem }) => (
      <DiscountListCard discount={item} colors={colors} onView={() => openEdit(item)} onDelete={() => openDelete(item)} />
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
            placeholder="Search by code or description…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Create</Text>
        </Pressable>
      </View>

      {discountsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading discount codes…</Text>
        </View>
      ) : filteredDiscounts.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No discount codes found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDiscounts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <ManageDiscountModal
        ref={manageModal.ref}
        colors={colors}
        discount={manageTarget.discount}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete discount?"
        description={deletingDiscount ? `"${deletingDiscount.code}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteDiscount.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 42, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
