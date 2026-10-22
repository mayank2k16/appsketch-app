import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { storage } from './storage';

/**
 * The app's haptic language (docs/haptics.md). Every touch, tab change and
 * event speaks through these few semantic calls so the whole app has one
 * consistent feel, on both platforms:
 *
 * - iOS uses the Taptic Engine through impact / selection / notification.
 * - Android uses `performHapticFeedback` constants (crisp, system-tuned,
 *   honours the user's touch-feedback setting) instead of raw vibration,
 *   which buzzes on most devices.
 *
 * All calls are fire-and-forget, never throw and are no-ops on web or when
 * the user has turned haptics off (Settings → Haptics).
 */
export const HAPTICS_ENABLED = 'HAPTICS_ENABLED';

const native = Platform.OS === 'ios' || Platform.OS === 'android';
const isAndroid = Platform.OS === 'android';

export function hapticsEnabled() {
  return native && storage.getBoolean(HAPTICS_ENABLED) !== false;
}

export function setHapticsEnabled(on: boolean) {
  storage.set(HAPTICS_ENABLED, on);
}

const ignore = () => {};
const A = Haptics.AndroidHaptics;
const S = Haptics.ImpactFeedbackStyle;

function impact(
  style: Haptics.ImpactFeedbackStyle,
  android: Haptics.AndroidHaptics
) {
  if (!hapticsEnabled()) return;
  if (isAndroid) Haptics.performAndroidHapticsAsync(android).catch(ignore);
  else Haptics.impactAsync(style).catch(ignore);
}

function notify(
  type: Haptics.NotificationFeedbackType,
  android: Haptics.AndroidHaptics
) {
  if (!hapticsEnabled()) return;
  if (isAndroid) Haptics.performAndroidHapticsAsync(android).catch(ignore);
  else Haptics.notificationAsync(type).catch(ignore);
}

export const haptic = {
  /** Any button, row, card or icon press. */
  tap: () => impact(S.Light, A.Virtual_Key),
  /** The primary action of a screen: Send, Build, Pay, Use app. */
  press: () => impact(S.Medium, A.Confirm),
  /** A big, weighty moment: deploy, publish, opening an app. */
  heavy: () => impact(S.Heavy, A.Long_Press),
  /** A soft, cushioned touch: sheets landing, cards settling. */
  soft: () => impact(S.Soft, A.Gesture_End),
  /** A crisp, small click: chips, segmented controls, steppers. */
  rigid: () => impact(S.Rigid, A.Segment_Tick),
  /** Tab changes, pickers, sliders, carousel snaps. */
  select: () => {
    if (!hapticsEnabled()) return;
    if (isAndroid)
      Haptics.performAndroidHapticsAsync(A.Segment_Tick).catch(ignore);
    else Haptics.selectionAsync().catch(ignore);
  },
  /** Switches. */
  toggle: (on: boolean) =>
    impact(on ? S.Medium : S.Light, on ? A.Toggle_On : A.Toggle_Off),
  /** Long press recognised. */
  longPress: () => impact(S.Heavy, A.Long_Press),
  /** Drag picked up (reorder, pull-to-refresh threshold). */
  dragStart: () => impact(S.Medium, A.Drag_Start),
  success: () => notify(Haptics.NotificationFeedbackType.Success, A.Confirm),
  warning: () =>
    notify(Haptics.NotificationFeedbackType.Warning, A.Context_Click),
  error: () => notify(Haptics.NotificationFeedbackType.Error, A.Reject),

  /**
   * A short choreographed sequence: [delay ms from now, kind]. Returns a
   * cancel function. Used for the splash and for "magic" moments (an app
   * finishing its build, a template opening).
   */
  sequence(steps: readonly (readonly [number, HapticKind])[]) {
    const timers = steps.map(([ms, kind]) => setTimeout(() => run(kind), ms));
    return () => timers.forEach(clearTimeout);
  },

  /** The signature "something wonderful just happened" flourish. */
  magic() {
    return haptic.sequence([
      [0, 'soft'],
      [70, 'tap'],
      [140, 'rigid'],
      [260, 'success'],
    ]);
  },
};

export type HapticKind =
  | 'tap'
  | 'press'
  | 'heavy'
  | 'soft'
  | 'rigid'
  | 'select'
  | 'success'
  | 'warning'
  | 'error';

function run(kind: HapticKind) {
  haptic[kind]();
}
