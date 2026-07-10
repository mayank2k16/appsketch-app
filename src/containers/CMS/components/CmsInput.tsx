import * as React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Props = Omit<TextInputProps, 'style'> & {
  colors: CmsThemeColors;
  label?: string;
  error?: string;
};

/** Labeled text field for CMS forms — replaces `@/components/ui`'s `Input`
 * inside the CMS so form text renders at the CMS's own scale/system font
 * instead of the app-wide NativeWind styling. Omit `label` for a bare field
 * (e.g. a quantity input sitting next to a picker). */
export function CmsInput({ colors, label, error, ...inputProps }: Props) {
  return (
    <View style={st.group}>
      {label ? <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          st.field,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
            color: colors.textPrimary,
          },
        ]}
        selectionColor={colors.accent}
        {...inputProps}
      />
      {error ? <Text style={[st.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...cmsType.inputValue,
  },
  error: cmsType.inputError,
});
