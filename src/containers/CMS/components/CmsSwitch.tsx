import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** Boolean toggle row for CMS forms — uses the platform-native `Switch` (no
 * custom text/animation needed for a simple on/off control), tracked in the
 * active theme's accent color. */
export function CmsSwitch({ colors, label, value, onChange }: Props) {
  return (
    <View style={st.row}>
      <Text style={[st.label, { color: colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: cmsType.buttonLabel,
});
