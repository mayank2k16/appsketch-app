import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type CmsModalProps = BottomSheetModalProps & {
  title?: string;
  colors: CmsThemeColors;
};

/** CMS's own bottom-sheet wrapper — built directly on `@gorhom/bottom-sheet`
 * rather than `@/components/ui`'s `Modal`, so the header is always CMS-theme
 * colored and never pulls in the app-wide shared `Text` component. */
export const CmsModal = React.forwardRef<BottomSheetModal, CmsModalProps>(
  ({ snapPoints: snapPointsProp = ['60%'], title, colors, backdropComponent, ...props }, ref) => {
    const snapPoints = React.useMemo(() => snapPointsProp, [snapPointsProp]);

    const renderBackdrop = React.useCallback(
      (backdropProps: BottomSheetBackdropProps) => <CmsBackdrop {...backdropProps} />,
      []
    );

    const renderHandleComponent = React.useCallback(
      () => <CmsModalHeader title={title} colors={colors} />,
      [title, colors]
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
        backgroundStyle={{ backgroundColor: colors.background }}
      />
    );
  }
);

function CmsModalHeader({ title, colors }: { title?: string; colors: CmsThemeColors }) {
  const { close } = useBottomSheet();
  return (
    <View>
      <View style={[st.handle, { backgroundColor: colors.border }]} />
      <View style={st.headerRow}>
        <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
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
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { ...cmsType.modalTitle, flex: 1 },
  closeBtn: { padding: 4 },
});
