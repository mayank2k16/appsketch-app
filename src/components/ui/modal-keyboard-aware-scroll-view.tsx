// source https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-aware-scroll-view
/**
 * This component is used to handle the keyboard in a modal.
 * It is a wrapper around the `KeyboardAwareScrollView` component from `react-native-keyboard-controller`.
 * It is used to handle the keyboard in a modal.
 * example usage:
      export function Example() {
        return (
          <Modal>
            <BottomSheetKeyboardAwareScrollView>
            </BottomSheetKeyboardAwareScrollView>
          </Modal>
        );
        }
 */
import {
  type BottomSheetScrollViewMethods,
  createBottomSheetScrollableComponent,
  SCROLLABLE_TYPE,
} from '@gorhom/bottom-sheet';
import { type BottomSheetScrollViewProps } from '@gorhom/bottom-sheet/src/components/bottomSheetScrollable/types';
import * as React from 'react';
import { memo } from 'react';
import { type KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Reanimated from 'react-native-reanimated';

const AnimatedScrollView =
  // Reanimated 4's overloads pick the FlatList signature for a forwardRef
  // component; the runtime call is the same as before the SDK 57 upgrade.
  Reanimated.createAnimatedComponent(
    KeyboardAwareScrollView as unknown as React.ComponentClass<KeyboardAwareScrollViewProps>
  );
const BottomSheetScrollViewComponent = createBottomSheetScrollableComponent<
  BottomSheetScrollViewMethods,
  BottomSheetScrollViewProps
>(SCROLLABLE_TYPE.SCROLLVIEW, AnimatedScrollView);
const BottomSheetKeyboardAwareScrollView = memo(BottomSheetScrollViewComponent);

BottomSheetKeyboardAwareScrollView.displayName =
  'BottomSheetKeyboardAwareScrollView';

export default BottomSheetKeyboardAwareScrollView as (
  props: BottomSheetScrollViewProps & KeyboardAwareScrollViewProps
) => ReturnType<typeof BottomSheetKeyboardAwareScrollView>;
