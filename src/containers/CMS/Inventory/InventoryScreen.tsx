import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { InventoryLocation } from '@/api/inventory';
import { useInventoryLocations } from '@/api/inventory';
import { useModal } from '@/components/ui';

import { useCmsTheme } from '../theme';
import { InventoryCard } from './components/InventoryCard';
import { ManageInventoryModal } from './components/ManageInventoryModal';

// `onMenuPress` isn't used here — the shell's persistent header already owns
// the one hamburger button — but the prop is part of the tab registry's
// component contract (`CmsTab['Component']`) so every tab accepts it.
export function InventoryScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCmsTheme();

  const locationsQuery = useInventoryLocations();
  const locations = locationsQuery.data ?? [];

  const manageModal = useModal();
  const [editingLocation, setEditingLocation] = React.useState<InventoryLocation | null>(null);

  function openCreate() {
    setEditingLocation(null);
    manageModal.present();
  }
  function openEdit(location: InventoryLocation) {
    setEditingLocation(location);
    manageModal.present();
  }

  const renderItem = React.useCallback(
    ({ item }: { item: InventoryLocation }) => (
      <InventoryCard location={item} colors={colors} onEdit={() => openEdit(item)} />
    ),
    [colors]
  );

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <View style={st.actionsRow}>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add Location</Text>
        </Pressable>
      </View>

      {locationsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading inventory locations…</Text>
        </View>
      ) : locations.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Your inventory locations will be shown here</Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
        />
      )}

      <ManageInventoryModal
        ref={manageModal.ref}
        colors={colors}
        selectedLocation={editingLocation}
        onSuccess={() => manageModal.dismiss()}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
