import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SystemVariable } from '@/api/notifications';

import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

/** Read-only — system variables are platform-provided, not editable here. */
export function SystemVariableChip({ variable, colors }: { variable: SystemVariable; colors: CmsThemeColors }) {
  return (
    <View style={[st.chip, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[st.name, { color: colors.accent }]}>{`{{${variable.name}}}`}</Text>
      <Text style={[st.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {variable.label}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  name: { ...cmsType.listMeta, fontWeight: '700', fontSize: 10 },
  label: { ...cmsType.listMeta, marginTop: 1, fontSize: 10 },
});
