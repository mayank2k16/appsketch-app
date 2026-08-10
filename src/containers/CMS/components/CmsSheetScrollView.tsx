import { BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import type { ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

/** Drop-in replacement for `@gorhom/bottom-sheet`'s `BottomSheetScrollView`
 * as a `CmsModal`'s content — use this instead so focused fields don't get
 * covered by the keyboard.
 *
 * Gorhom's own keyboard tracking (a plain RN `Keyboard.addListener`) doesn't
 * reliably fire on Android with edge-to-edge enabled (this app has
 * `expo.edgeToEdgeEnabled=true`), so `keyboardBehavior`/`android_keyboardInputMode`
 * on `CmsModal` alone leave the sheet not moving at all when a field is
 * focused. `KeyboardAwareScrollView` from `react-native-keyboard-controller`
 * — already the proven fix for this exact issue elsewhere in the app
 * (`AgentScreen`, `login-form`) — uses native, edge-to-edge-aware keyboard
 * height tracking instead and auto-scrolls the focused field above the
 * keyboard.
 *
 * `BottomSheetView` still wraps it purely to register the content region
 * with the sheet's internal layout — this is safe because no CMS sheet uses
 * `enablePanDownToClose` or multiple snap points, so nothing depends on
 * `BottomSheetScrollView`'s gesture cooperation with the sheet's pan
 * handler. */
export function CmsSheetScrollView({ children, contentContainerStyle, ...scrollViewProps }: Props) {
  return (
    <BottomSheetView style={st.flex}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={contentContainerStyle}
        {...scrollViewProps}
      >
        {children}
      </KeyboardAwareScrollView>
    </BottomSheetView>
  );
}

const st = { flex: { flex: 1 } };
