import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CustomVariable } from '@/api/notifications';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

export const CustomVariableRow = React.memo(function CustomVariableRow({
  variable,
  colors,
  onEdit,
  onDelete,
}: {
  variable: CustomVariable;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const valuePreview = variable.source === 'STATIC' ? variable.static_value : variable.attribute_path;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {`{{${variable.name}}}`}
        </Text>
        <CmsStatusBadge
          meta={
            variable.is_active
              ? { label: 'Active', color: colors.success, kind: 'success' }
              : { label: 'Inactive', color: colors.textSecondary, kind: 'info' }
          }
        />
      </View>

      <Text style={[st.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {variable.label}
      </Text>

      <View style={st.metaRow}>
        <Text style={[st.sourceBadge, { color: colors.accent, borderColor: colors.accent }]}>
          {variable.source}
        </Text>
        {!!valuePreview && (
          <Text style={[st.value, { color: colors.textSecondary }]} numberOfLines={1}>
            {valuePreview}
          </Text>
        )}
      </View>

      <View style={st.actions}>
        <Pressable onPress={onEdit} style={st.actionBtn} hitSlop={8}>
          <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onDelete} style={st.actionBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
      </View>
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
    gap: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { ...cmsType.listSubtitle, flex: 1 },
  label: cmsType.listMeta,
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  sourceBadge: {
    ...cmsType.listBadge,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  value: { ...cmsType.listMeta, flex: 1 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
