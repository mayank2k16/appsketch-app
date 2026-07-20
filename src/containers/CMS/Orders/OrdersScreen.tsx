import { Audio } from 'expo-av';
import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { OrderListItem as OrderListItemType } from '@/api/orders';
import { useAcceptOrder, useDeleteOrder, useOrderDetail, useOrders, useRejectOrder } from '@/api/orders';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { OrderListItem } from './components/OrderListItem';
import { OrderSearchBar } from './components/OrderSearchBar';

// `onMenuPress` isn't used here — the shell's persistent header already owns
// the one hamburger button — but the prop is part of the tab registry's
// component contract (`CmsTab['Component']`) so every tab accepts it.
export function OrdersScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCmsTheme();

  const ordersQuery = useOrders();
  const orders = ordersQuery.data ?? [];

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const [notifications, setNotifications] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const lastTopIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  React.useEffect(() => {
    if (orders.length === 0) return;
    const topId = orders[0]?.id ?? null;
    if (notifications && lastTopIdRef.current !== null && topId !== lastTopIdRef.current) {
      playNotificationSound();
    }
    lastTopIdRef.current = topId;
  }, [orders, notifications]);

  async function playNotificationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../../assets/sounds/notification.wav')
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // best-effort — notification sound is a nicety, not critical
    }
  }

  const sortedOrders = React.useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()),
    [orders]
  );

  const filteredOrders = React.useMemo(() => {
    if (debouncedQuery.trim().length < 3) return sortedOrders;
    const q = debouncedQuery.toLowerCase();
    return sortedOrders.filter(
      (o) => String(o.id) === debouncedQuery || o.customer?.name?.toLowerCase().includes(q)
    );
  }, [sortedOrders, debouncedQuery]);

  // ── Create / edit ────────────────────────────────────────────────────────
  const createModal = useModal();
  const [editingOrderId, setEditingOrderId] = React.useState<number | null>(null);
  const editDetail = useOrderDetail(editingOrderId);

  function openCreate() {
    setEditingOrderId(null);
    createModal.present();
  }
  function openEdit(order: OrderListItemType) {
    setEditingOrderId(order.id);
    createModal.present();
  }

  // ── View detail ──────────────────────────────────────────────────────────
  const viewModal = useModal();
  const [viewingOrderId, setViewingOrderId] = React.useState<number | null>(null);
  const viewDetail = useOrderDetail(viewingOrderId);

  function openView(order: OrderListItemType) {
    setViewingOrderId(order.id);
    viewModal.present();
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmModal = useModal();
  const [deletingOrder, setDeletingOrder] = React.useState<OrderListItemType | null>(null);
  const deleteOrder = useDeleteOrder();

  function openDelete(order: OrderListItemType) {
    setDeletingOrder(order);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingOrder) return;
    deleteOrder.mutate(deletingOrder.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingOrder(null);
      },
    });
  }

  // ── Accept / reject ──────────────────────────────────────────────────────
  const [actionOrderId, setActionOrderId] = React.useState<number | null>(null);
  const acceptOrder = useAcceptOrder();
  const rejectOrder = useRejectOrder();

  function handleAccept(order: OrderListItemType) {
    setActionOrderId(order.id);
    acceptOrder.mutate(order.id, { onSettled: () => setActionOrderId(null) });
  }
  function handleReject(order: OrderListItemType) {
    setActionOrderId(order.id);
    rejectOrder.mutate(order.id, { onSettled: () => setActionOrderId(null) });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: OrderListItemType }) => (
      <OrderListItem
        order={item}
        colors={colors}
        busy={actionOrderId === item.id}
        onEdit={() => openEdit(item)}
        onView={() => openView(item)}
        onDelete={() => openDelete(item)}
        onAccept={() => handleAccept(item)}
        onReject={() => handleReject(item)}
      />
    ),
    [colors, actionOrderId]
  );

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <View style={[st.header, { paddingTop: 12 }]}>
        <Pressable
          onPress={() => setNotifications((v) => !v)}
          style={[st.iconBtn, { backgroundColor: colors.sidebarActiveBg }]}
          hitSlop={8}
        >
          <Ionicons
            name={notifications ? 'notifications' : 'notifications-off-outline'}
            size={18}
            color={notifications ? colors.success : colors.textPrimary}
          />
        </Pressable>
        <Pressable
          onPress={openCreate}
          style={[st.createBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.createBtnText, { color: colors.accentText }]}>Create</Text>
        </Pressable>
      </View>

      <View style={{ paddingTop: 12 }}>
        <OrderSearchBar value={query} onChangeText={setQuery} colors={colors} />
      </View>

      {ordersQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading orders…</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Your orders will be shown here</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => `${item.id}-${item.status}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <View style={st.center}>
              <Text style={{ color: colors.textSecondary }}>No orders found matching your search</Text>
            </View>
          }
        />
      )}

      <CreateOrderModal
        ref={createModal.ref}
        colors={colors}
        selectedOrder={editingOrderId ? (editDetail.data ?? null) : null}
        onSuccess={() => {
          createModal.dismiss();
          setEditingOrderId(null);
        }}
      />
      <OrderDetailModal ref={viewModal.ref} colors={colors} order={viewDetail.data ?? null} />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title="Delete order?"
        description={deletingOrder ? `Order #${deletingOrder.id} will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteOrder.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  createBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
});
