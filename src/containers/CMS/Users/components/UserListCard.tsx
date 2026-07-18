import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getRoleColor } from '../utils';

type UserLike = {
  id: number;
  name?: string;
  phone_number?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
};

type Props = {
  user: UserLike;
  colors: CmsThemeColors;
  roleLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
};

export const UserListCard = React.memo(function UserListCard({ user, colors, roleLabel, deleteLabel, onEdit, onDelete }: Props) {
  const roleColor = getRoleColor(user.role);
  const initial = (user.name || user.phone_number || '?').trim().charAt(0).toUpperCase();
  const active = user.is_active !== false;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <View style={[st.avatar, { backgroundColor: roleColor }]}>
          <Text style={st.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {user.name || '—'}
          </Text>
          <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {user.phone_number || '—'}
            {user.email ? ` · ${user.email}` : ''}
          </Text>
        </View>
        <CmsStatusBadge
          meta={
            active
              ? { label: 'Active', color: colors.success, kind: 'success' }
              : { label: 'Inactive', color: colors.danger, kind: 'danger' }
          }
        />
      </View>

      <View style={st.footerRow}>
        {user.role ? <CmsStatusBadge meta={{ label: roleLabel, color: roleColor, kind: 'info' }} /> : <View />}
        <View style={st.actions}>
          <Pressable onPress={onEdit} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
            <Text style={[st.actionLabel, { color: colors.textPrimary }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[st.actionLabel, { color: colors.danger }]}>{deleteLabel}</Text>
          </Pressable>
        </View>
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
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  name: cmsType.listTitle,
  meta: cmsType.listMeta,
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  actionLabel: cmsType.buttonLabel,
});
