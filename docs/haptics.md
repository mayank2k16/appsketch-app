# Haptics

Every touch, tab change and event in AppSketch has a haptic, on iOS and
Android. Every haptic goes through `src/lib/haptics.ts`. Never call
`expo-haptics` directly.

## The vocabulary

| Call | When | iOS | Android |
| --- | --- | --- | --- |
| `haptic.tap()` | any button, row, card or icon | light impact | `VIRTUAL_KEY` |
| `haptic.press()` | a screen's primary action: Send, Build, Pay, Use app | medium impact | `CONFIRM` |
| `haptic.heavy()` | a weighty moment, such as opening an app | heavy impact | `LONG_PRESS` |
| `haptic.soft()` | sheets, drawers and drags landing | soft impact | `GESTURE_END` |
| `haptic.rigid()` | chips, segmented controls, steppers | rigid impact | `SEGMENT_TICK` |
| `haptic.select()` | tab changes, pickers, carousel snaps | selection | `SEGMENT_TICK` |
| `haptic.toggle(on)` | switches | medium or light | `TOGGLE_ON` / `TOGGLE_OFF` |
| `haptic.success()` / `warning()` / `error()` | outcomes and toasts | notification | `CONFIRM` / `CONTEXT_CLICK` / `REJECT` |
| `haptic.magic()` | a build finishing, or another "wow" moment | soft → tap → rigid → success | same |
| `haptic.sequence([[ms, kind], …])` | choreographed moments; returns a cancel function | | |

- Android uses `performHapticFeedback` constants rather than raw vibration.
  They are crisp, tuned by the system, and respect the phone's touch-feedback
  setting.
- `PressableScale` taps on press-in by default. Pass `haptic="press"` for a
  screen's primary action, or `haptic={false}` for rapid-fire keys.

## The splash

The white splash fires a sequence timed to the Lottie's frames at 30fps,
defined as `SPLASH_HAPTICS` in `src/app/splash.tsx`:

1. The drop lands: press.
2. The flood starts, then fills the screen: soft, soft.
3. The tile snaps into place, then settles: rigid, tap.
4. The pencil lands: tap.
5. The logo completes and the wordmark rises: success.

If you change the animation, change these timings with it. The dark splash
fires a soft haptic as its wordmark surfaces, then success.

## Off switch

Settings → Haptics stores `HAPTICS_ENABLED` in MMKV, and haptics are on by
default. Every call checks it, so nothing else needs to.
