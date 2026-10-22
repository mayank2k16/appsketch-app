import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { storage } from './storage';

/**
 * The app's haptic language (docs/haptics.md). Haptics are RESTRAINED and
 * opt-in: only tab changes, segmented toggles, switches, the prompt's Send,
 * opening an app/template, a finished build and errors vibrate — never
 * ordinary rows, cards, links, sheets, scrolls or keystrokes. One haptic per
 * event, never a sequence. On both platforms:
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
  /** A light tap: opening an app or template. */
  tap: () => impact(S.Light, A.Virtual_Key),
  /** The prompt's Send / Build action — the only medium impact. */
  press: () => impact(S.Medium, A.Confirm),
  /** A soft, cushioned touch: the splash icon landing (once). */
  soft: () => impact(S.Soft, A.Gesture_End),
  /** Tab changes and segmented toggles (only when the value changes). */
  select: () => {
    if (!hapticsEnabled()) return;
    if (isAndroid)
      Haptics.performAndroidHapticsAsync(A.Segment_Tick).catch(ignore);
    else Haptics.selectionAsync().catch(ignore);
  },
  /** Switches: always a light click, on or off. */
  toggle: (on: boolean) => impact(S.Light, on ? A.Toggle_On : A.Toggle_Off),
  success: () => notify(Haptics.NotificationFeedbackType.Success, A.Confirm),
  warning: () =>
    notify(Haptics.NotificationFeedbackType.Warning, A.Context_Click),
  error: () => notify(Haptics.NotificationFeedbackType.Error, A.Reject),

  /** An app finished building: one success, no multi-step flourish. */
  magic: () => haptic.success(),
};

export type HapticKind =
  | 'tap'
  | 'press'
  | 'soft'
  | 'select'
  | 'success'
  | 'warning'
  | 'error';
