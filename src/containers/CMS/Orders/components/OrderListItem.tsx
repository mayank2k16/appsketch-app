import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { OrderListItem as OrderListItemType } from '@/api/orders';

import type { CmsThemeColors } from '../../theme';
import { formatOrderDate, getOrderStatusMeta, getPaymentStatusMeta } from '../utils';
import { CmsStatusBadge as StatusBadge } from '../../components';

type Props = {
  order: OrderListItemType;
  colors: CmsThemeColors;
  busy: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onAccept: () => void;
  onReject: () => void;
};

function ActionButton({
  icon,
  color,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[st.actionBtn, disabled && { opacity: 0.4 }]}
      hitSlop={8}
    >
      <Ionicons name={icon} size={16} color={color} />
    </Pressable>
  );
}

export const OrderListItem = React.memo(function OrderListItem({
  order,
  colors,
  busy,
  onEdit,
  onView,
  onDelete,
  onAccept,
  onReject,
}: Props) {
  const orderStatus = getOrderStatusMeta(order.status);
  const paymentStatus = getPaymentStatusMeta(order.payment_status);
  const isInitialised = order.status === 'INITIALISED';

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.orderId, { color: colors.textPrimary }]}>#{order.id}</Text>
        <Text style={[st.date, { color: colors.textSecondary }]}>{formatOrderDate(order.created_on)}</Text>
      </View>

      <Text style={[st.customer, { color: colors.textPrimary }]} numberOfLines={1}>
        {order.customer?.name || 'N/A'}
        {order.customer?.phone_number ? ` (${order.customer.phone_number})` : ''}
      </Text>

      <View style={st.badgeRow}>
        <StatusBadge meta={paymentStatus} />
        <StatusBadge meta={orderStatus} />
      </View>

      <View style={st.footerRow}>
        <Text style={[st.total, { color: colors.textPrimary }]}>
          Rs. {Number(order.total_price).toFixed(2)}
        </Text>

        {busy ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <View style={st.actions}>
            <ActionButton icon="create-outline" color={colors.textSecondary} onPress={onEdit} />
            <ActionButton icon="eye-outline" color={colors.textSecondary} onPress={onView} />
            <ActionButton icon="trash-outline" color={colors.danger} onPress={onDelete} />
            {isInitialised && (
              <>
                <ActionButton icon="checkmark" color={colors.success} onPress={onAccept} />
                <ActionButton icon="close" color={colors.danger} onPress={onReject} />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
  },
  date: {
    fontSize: 12,
  },
  customer: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
