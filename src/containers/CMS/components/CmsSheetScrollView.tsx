import type { BottomSheetScrollViewProps } from '@gorhom/bottom-sheet/src/components/bottomSheetScrollable/types';
import * as React from 'react';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

import BottomSheetKeyboardAwareScrollView from '@/components/ui/modal-keyboard-aware-scroll-view';

type Props = BottomSheetScrollViewProps &
  KeyboardAwareScrollViewProps & {
    children: React.ReactNode;
  };

/** Scroll container for `CmsModal` forms. Wraps `KeyboardAwareScrollView` via
 * gorhom's `createBottomSheetScrollableComponent` so it registers with the
 * sheet's own gesture handler — a plain `KeyboardAwareScrollView` dropped
 * inside a `BottomSheetView` never gets that wiring, which is what made the
 * Inventory form's sheet fail to scroll (drag gestures went to the sheet
 * instead of the content). `enableFooterMarginAdjustment` pads the content
 * so the last field isn't hidden behind a sticky `CmsModal` footer. */
export function CmsSheetScrollView({
  children,
  contentContainerStyle,
  ...scrollViewProps
}: Props) {
  return (
    <BottomSheetKeyboardAwareScrollView
      bottomOffset={24}
      enableFooterMarginAdjustment
      contentContainerStyle={contentContainerStyle}
      {...scrollViewProps}
    >
      {children}
    </BottomSheetKeyboardAwareScrollView>
  );
}
