import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

export type CmsConfirmModalProps = {
  colors: CmsThemeColors;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Kept for drop-in compatibility with `@/components/ui`'s `ConfirmModal` —
   * this component's whole point is a destructive-styled confirm, so it's
   * effectively always true, but callers that pass `destructive={false}`
   * for a non-destructive confirm still get a sane (non-red) look. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

/** CMS's own delete/destructive confirmation sheet — replaces
 * `@/components/ui`'s `ConfirmModal`, which hardcodes neutral NativeWind
 * grays and never reads the active CMS palette, so it looked like a
 * generic system dialog dropped into a themed screen. Centered icon badge
 * + title + description + Cancel/Confirm, built directly on
 * `BottomSheetModal` (own handle, no title row) since the icon-badge layout
 * doesn't fit `CmsModal`'s left-aligned title-row header.
 *
 * Themes fully off `colors` in both light and dark palettes — same as every
 * other Cms* component. (An earlier version rendered dark palettes on a
 * fixed near-black instead of `colors.surface`; reverted per the user —
 * this should track whichever of the 5 CMS palettes is active, not diverge
 * into its own look for dark ones.) */
export const CmsConfirmModal = React.forwardRef<BottomSheetModal, CmsConfirmModalProps>(
  ({ colors, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = true, loading = false, onConfirm }, ref) => {
    const palette = {
      sheetBg: colors.surface,
      border: colors.border,
      handle: colors.border,
      title: colors.textPrimary,
      description: colors.textSecondary,
      cancelBg: colors.background,
      cancelBorder: colors.border,
      cancelText: colors.textPrimary,
    };

    const actionColor = destructive ? colors.danger : colors.accent;

    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => <CmsConfirmBackdrop {...props} onPress={() => (ref as React.RefObject<BottomSheetModal | null>)?.current?.dismiss()} />,
      [ref]
    );

    const renderHandle = React.useCallback(
      () => <View style={[st.handle, { backgroundColor: palette.handle }]} />,
      [palette.handle]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={['35%']}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={false}
        handleComponent={renderHandle}
        backgroundStyle={{ backgroundColor: palette.sheetBg }}
      >
        <View style={st.body}>
          <View style={[st.iconBadge, { backgroundColor: `${actionColor}1F` }]}>
            <Ionicons name={destructive ? 'trash-outline' : 'help-circle-outline'} size={24} color={actionColor} />
          </View>
          <Text style={[st.title, { color: palette.title }]}>{title}</Text>
          {description ? <Text style={[st.description, { color: palette.description }]}>{description}</Text> : null}

          <View style={st.btnRow}>
            <Pressable
              onPress={() => (ref as React.RefObject<BottomSheetModal | null>)?.current?.dismiss()}
              disabled={loading}
              style={[st.btn, { backgroundColor: palette.cancelBg, borderWidth: 1, borderColor: palette.cancelBorder }, loading && st.btnDisabled]}
            >
              <Text style={[st.btnLabel, { color: palette.cancelText }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={[st.btn, { backgroundColor: actionColor }, loading && st.btnDisabled]}
            >
              {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[st.btnLabel, { color: '#FFFFFF' }]}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </BottomSheetModal>
    );
  }
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function CmsConfirmBackdrop({ style, onPress }: BottomSheetBackdropProps & { onPress: () => void }) {
  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
    />
  );
}

const st = StyleSheet.create({
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, alignItems: 'center' },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { ...cmsType.modalTitle, textAlign: 'center', marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 40, width: '100%' },
  btn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnLabel: cmsType.buttonLabel,
});
