import { Ionicons } from '@expo/vector-icons';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import {
  BottomSheetFooter,
  BottomSheetModal,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type CmsModalProps = Omit<BottomSheetModalProps, 'children'> & {
  title?: string;
  colors: CmsThemeColors;
  children?: React.ReactNode;
  /** Rendered pinned to the bottom of the sheet (outside the scrollable
   * body) via gorhom's `footerComponent`, e.g. a form's submit button. */
  footer?: React.ReactNode;
};

/** Tracks whether the current render tree is inside a `CmsModal` bottom
 * sheet — `CmsInput`/`CmsVariableInput` read this to swap in
 * `BottomSheetTextInput`, which is required for the keyboard to push the
 * sheet up instead of covering the focused field. Defaults to `false` so
 * those inputs keep working unchanged on plain (non-sheet) CMS screens. */
export const CmsBottomSheetInputContext = React.createContext(false);

/** CMS's own bottom-sheet wrapper — built directly on `@gorhom/bottom-sheet`
 * rather than `@/components/ui`'s `Modal`, so the header is always CMS-theme
 * colored and never pulls in the app-wide shared `Text` component.
 *
 * Defaults `stackBehavior` to `'push'` (gorhom's own default is `'switch'`),
 * because CMS forms routinely open a `CmsSelect`/`CmsModal` picker from
 * inside an already-open `CmsModal` (e.g. Invoice's "Invoice Type"/
 * "Inventory" dropdowns). `'switch'` minimizes the parent sheet before
 * presenting the child, and that minimize/restore choreography is what was
 * making the nested picker fail to appear. `'push'` leaves the parent sheet
 * mounted and visible and simply layers the child on top, so dismissing the
 * child reveals the parent exactly as it was — no restore step to race. */
export const CmsModal = React.forwardRef<BottomSheetModal, CmsModalProps>(
  (
    {
      snapPoints: snapPointsProp = ['60%'],
      title,
      colors,
      backdropComponent,
      children,
      footer,
      keyboardBehavior = 'interactive',
      keyboardBlurBehavior = 'restore',
      android_keyboardInputMode = 'adjustResize',
      stackBehavior = 'push',
      ...props
    },
    ref
  ) => {
    const snapPoints = React.useMemo(() => snapPointsProp, [snapPointsProp]);
    const insets = useSafeAreaInsets();

    const renderBackdrop = React.useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <CmsBackdrop {...backdropProps} />
      ),
      []
    );

    const renderHandleComponent = React.useCallback(
      () => <CmsModalHeader title={title} colors={colors} />,
      [title, colors]
    );

    const renderFooter = React.useCallback(
      (footerProps: BottomSheetFooterProps) => (
        <BottomSheetFooter {...footerProps}>
          <View
            style={[
              st.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            {footer}
          </View>
        </BottomSheetFooter>
      ),
      [footer, colors, insets.bottom]
    );

    return (
      <BottomSheetModal
        {...props}
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={backdropComponent || renderBackdrop}
        enableDynamicSizing={false}
        handleComponent={renderHandleComponent}
        footerComponent={footer ? renderFooter : undefined}
        backgroundStyle={{ backgroundColor: colors.background }}
        keyboardBehavior={keyboardBehavior}
        keyboardBlurBehavior={keyboardBlurBehavior}
        android_keyboardInputMode={android_keyboardInputMode}
        stackBehavior={stackBehavior}
      >
        <CmsBottomSheetInputContext.Provider value={true}>
          {children}
        </CmsBottomSheetInputContext.Provider>
      </BottomSheetModal>
    );
  }
);

function CmsModalHeader({
  title,
  colors,
}: {
  title?: string;
  colors: CmsThemeColors;
}) {
  const { close } = useBottomSheet();
  return (
    <View>
      <View style={[st.handle, { backgroundColor: colors.border }]} />
      <View style={st.headerRow}>
        <Text
          style={[st.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Pressable onPress={() => close()} hitSlop={12} style={st.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function CmsBackdrop({ style }: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
    />
  );
}

const st = StyleSheet.create({
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { ...cmsType.modalTitle, flex: 1 },
  closeBtn: { padding: 4 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
