import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/ui';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Variant = 'primary' | 'ghost' | 'danger';

type Props = {
  colors: CmsThemeColors;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: object;
};

/** CMS's own button — `primary` fills with the active theme's accent color
 * (fixing the app-wide `Button`'s fixed default brand color, which doesn't
 * follow the CMS palette), `ghost`/`danger` for secondary/destructive
 * actions. */
export function CmsButton({ colors, label, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const isDisabled = disabled || loading;

  const variantStyle =
    variant === 'primary'
      ? { backgroundColor: colors.accent, borderWidth: 0 }
      : variant === 'danger'
        ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.danger }
        : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border };

  const labelColor =
    variant === 'primary' ? colors.accentText : variant === 'danger' ? colors.danger : colors.textPrimary;

  return (
    <PressableScale
      onPress={onPress}
      // The filled button is a form's primary action (Save, Create).
      disabled={isDisabled}
      style={[st.btn, variantStyle, isDisabled && st.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Text style={[st.label, { color: labelColor }]}>{label}</Text>
      )}
    </PressableScale>
  );
}

const st = StyleSheet.create({
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  label: cmsType.buttonLabel,
});
