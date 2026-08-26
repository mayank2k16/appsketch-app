import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { VendorListItem } from '@/api/vendors';

import { CmsButton, CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getVendorStatusMeta } from '../utils';

type Props = {
  vendor: VendorListItem;
  colors: CmsThemeColors;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionsDisabled?: boolean;
};

export const VendorListCard = React.memo(function VendorListCard({
  vendor,
  colors,
  onView,
  onApprove,
  onReject,
  actionsDisabled,
}: Props) {
  const isApproved = vendor.status === 'approved';
  const documentCount = vendor.documents ? Object.keys(vendor.documents).length : 0;
  const initial = (vendor.title || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.topRow}>
        <View style={[st.avatar, { backgroundColor: `${colors.accent}18` }]}>
          <Text style={[st.avatarText, { color: colors.accent }]}>{initial}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={st.nameRow}>
            <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {vendor.title || 'N/A'}
            </Text>
            <CmsStatusBadge meta={getVendorStatusMeta(vendor.status)} />
          </View>

          <View style={st.chipRow}>
            <View style={[st.chip, { borderColor: colors.border }]}>
              <Ionicons name="storefront-outline" size={11} color={colors.textSecondary} />
              <Text style={[st.chipText, { color: colors.textSecondary }]}>{vendor.tenant_type || 'N/A'}</Text>
            </View>
            {documentCount > 0 ? (
              <View style={[st.chip, { borderColor: colors.border }]}>
                <Ionicons name="document-text-outline" size={11} color={colors.textSecondary} />
                <Text style={[st.chipText, { color: colors.textSecondary }]}>
                  {documentCount} document{documentCount === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable onPress={onView} hitSlop={8} style={[st.viewBtn, { borderColor: colors.border }]}>
          <Ionicons name="eye-outline" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      {!isApproved ? (
        <View style={st.actions}>
          <CmsButton colors={colors} label="Approve" onPress={onApprove} disabled={actionsDisabled} style={{ paddingVertical: 7, width: 110 }} />
          <CmsButton colors={colors} label="Reject" variant="danger" onPress={onReject} disabled={actionsDisabled} style={{ paddingVertical: 7, width: 110 }} />
        </View>
      ) : null}
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    minHeight: 100,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { ...cmsType.listTitle, flexShrink: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10.5, fontWeight: '600' },
  viewBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6, marginLeft: 'auto' },
});
