import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { InventoryLocation } from '@/api/inventory';

import type { CmsThemeColors } from '../../theme';

type Props = {
  location: InventoryLocation;
  colors: CmsThemeColors;
  onEdit: () => void;
};

export const InventoryCard = React.memo(function InventoryCard({
  location,
  colors,
  onEdit,
}: Props) {
  return (
    <Pressable
      onPress={onEdit}
      style={[
        st.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={st.headerRow}>
        <Text
          style={[st.name, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {location.name}
        </Text>
        <View
          style={[
            st.badge,
            {
              backgroundColor: location.is_active
                ? `${colors.success}18`
                : `${colors.danger}18`,
              borderColor: location.is_active
                ? `${colors.success}40`
                : `${colors.danger}40`,
            },
          ]}
        >
          <Text
            style={[
              st.badgeLabel,
              { color: location.is_active ? colors.success : colors.danger },
            ]}
          >
            {location.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text
        style={[st.address, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {location.address}
      </Text>

      <View style={st.footerRow}>
        <View style={st.metaRow}>
          <Text style={[st.metaLabel, st.metaLabelCode, { color: colors.textSecondary }]}>
            Code
          </Text>
          <Text style={[st.metaValue, { color: colors.textPrimary }]}>
            {location.code}
          </Text>
        </View>
        <View style={st.metaRow}>
          <Text style={[st.metaLabel, st.metaLabelPinCode, { color: colors.textSecondary }]}>
            Pincode
          </Text>
          <Text style={[st.metaValue, { color: colors.textPrimary }]}>
            {location.pincode ?? 'NA'}
          </Text>
        </View>
        <View style={st.metaRow}>
          <Text style={[st.metaLabel, st.metaLabelDist, { color: colors.textSecondary }]}>
            Del. Dist.
          </Text>
          <Text style={[st.metaValue, { color: colors.textPrimary }]}>
            {location.delivery_distance ?? 0}m
          </Text>
        </View>
        <Ionicons
          name="create-outline"
          size={16}
          color={colors.textSecondary}
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  address: {
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 6,
    marginTop: 4,
  },
  metaRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,

  },
  metaLabel: {
    fontSize: 11,
    // flex: 1,
    paddingRight: 0,
    flexShrink: 0,
  },
  metaLabelCode: {
    minWidth: 35,
  },
  metaLabelPinCode: {
    minWidth: 48,
  },
  metaLabelDist: {
    minWidth: 53,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
    paddingRight: 1,
  },
});
