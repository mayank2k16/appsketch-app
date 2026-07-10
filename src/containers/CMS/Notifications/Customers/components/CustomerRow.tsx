import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NotificationCustomer } from '@/api/notifications';

import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

export const CustomerRow = React.memo(function CustomerRow({
  customer,
  colors,
}: {
  customer: NotificationCustomer;
  colors: CmsThemeColors;
}) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {customer.name || 'Unnamed'}
        </Text>
        {customer.is_verified ? (
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        ) : (
          <Ionicons name="ellipse-outline" size={16} color={colors.textSecondary} />
        )}
      </View>
      {!!customer.email && (
        <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {customer.email}
        </Text>
      )}
      {!!customer.phone_number && (
        <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {customer.phone_number}
        </Text>
      )}
      {!!customer.inventory_name && (
        <Text style={[st.inventory, { color: colors.textSecondary }]} numberOfLines={1}>
          {customer.inventory_name}
        </Text>
      )}
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { ...cmsType.listSubtitle, flex: 1 },
  meta: cmsType.listMeta,
  inventory: { ...cmsType.listMeta, fontStyle: 'italic' },
});
