import { cssInterop } from 'nativewind';
import React from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { PressableScale, type PressableScaleProps } from './pressable-scale';

// PressableScale is a custom component, so nativewind needs telling that its
// `className` resolves into `style` (it merges with the scale transform).
cssInterop(PressableScale, { className: 'style' });

// React 19 passes `ref` as a prop, and PressableScale spreads it onto its
// Pressable; this only widens the type so Button can keep forwarding its ref.
const ScalePressable = PressableScale as React.ComponentType<
  React.ComponentProps<typeof PressableScale> & { ref?: React.Ref<View> }
>;

// White (docs/white-theme.md): ink fills and hairline outlines. The disabled
// look is unchanged in both themes (no dim — `disabledOpacity={1}`), and every
// `dark:` class is exactly what it was, so dark renders unchanged.

const button = tv({
  slots: {
    container: 'my-2 flex flex-row items-center justify-center rounded-md px-4',
    label: 'text-base font-semibold',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-[#0B0B0C] dark:bg-white',
        label: 'text-white dark:text-black',
        indicator: 'text-white dark:text-black',
      },
      secondary: {
        container: 'bg-primary-600',
        label: 'text-secondary-600',
        indicator: 'text-white',
      },
      outline: {
        container:
          'border border-[#E7E7E4] bg-white dark:border-neutral-400 dark:bg-transparent',
        label: 'text-[#0B0B0C] dark:text-neutral-100',
        indicator: 'text-[#0B0B0C] dark:text-neutral-100',
      },
      destructive: {
        container: 'bg-[#E5484D] dark:bg-red-600',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-[#0B0B0C] underline dark:text-white',
        indicator: 'text-[#0B0B0C] dark:text-white',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-black',
        indicator: 'text-black',
      },
    },
    size: {
      default: {
        container: 'h-10 px-4',
        label: 'text-base',
      },
      lg: {
        container: 'h-12 px-8',
        label: 'text-xl',
      },
      sm: {
        container: 'h-8 px-3',
        label: 'text-sm',
        indicator: 'h-2',
      },
      icon: { container: 'size-9' },
    },
    disabled: {
      true: {
        container: 'bg-neutral-300 dark:bg-neutral-300',
        label: 'text-neutral-600 dark:text-neutral-600',
        indicator: 'text-neutral-400 dark:text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props
  extends ButtonVariants,
    Omit<PressableProps, 'disabled' | 'style'> {
  /** A plain style (no pressed-state callback — the press feedback is the
   *  PressableScale spring). */
  style?: StyleProp<ViewStyle>;
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  /** Opt-in press haptic (none by default, docs/haptics.md). */
  haptic?: PressableScaleProps['haptic'];
}

export const Button = React.forwardRef<View, Props>(
  (
    {
      label: text,
      loading = false,
      variant = 'default',
      disabled = false,
      size = 'default',
      className = '',
      testID,
      textClassName = '',
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );
    // Press feedback is PressableScale's spring (haptic only if opted in).
    return (
      <ScalePressable
        disabled={Boolean(disabled || loading)}
        disabledOpacity={1}
        className={styles.container({ className })}
        {...props}
        ref={ref}
        testID={testID}
      >
        {props.children ? (
          props.children
        ) : (
          <>
            {loading ? (
              <ActivityIndicator
                size="small"
                className={styles.indicator()}
                testID={testID ? `${testID}-activity-indicator` : undefined}
              />
            ) : (
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
            )}
          </>
        )}
      </ScalePressable>
    );
  }
);
