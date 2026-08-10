import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { CmsBottomSheetInputContext } from './CmsModal';

type Props = Omit<TextInputProps, 'style'> & {
  colors: CmsThemeColors;
  label?: string;
  error?: string;
  /** Shows a `*` next to the label so the field reads as required before the
   * user ever submits, instead of only surfacing via the post-submit `error`. */
  required?: boolean;
};


export function CmsInput({ colors, label, error, required, ...inputProps }: Props) {
  const isInsideBottomSheet = React.useContext(CmsBottomSheetInputContext);
  const Field = isInsideBottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={st.group}>
      {label ? (
        <Text style={[st.label, { color: colors.textSecondary }]}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <Field
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
