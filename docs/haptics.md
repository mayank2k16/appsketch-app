# Haptics

Haptics in AppSketch are **restrained and opt-in**. Users found the earlier
"a haptic on every touch" sweep too much, so a vibration now marks only a
real moment. Ordinary taps, scrolls and typing stay silent. Every haptic goes
through `src/lib/haptics.ts`. Never call `expo-haptics` directly.

## Rules

1. **Opt-in.** `PressableScale` (and `Button`, which wraps it) fires nothing
   unless you pass a `haptic` prop.
2. **One haptic per event.** There are no sequences or multi-step flourishes.
   `haptic.magic()` is a single `success`.
3. **Light by default.** Use `select` or `tap`. `press` (medium) is reserved
   for the prompt's Send / Build action. Nothing uses a heavy impact.
4. **Fire only on change.** A segmented toggle or tab vibrates when the value
   changes, not when the user taps the option that is already selected
   (`haptic={active ? false : 'select'}`).

## Where haptics are allowed

| Where | Call |
| --- | --- |
| Bottom tab bar and code-editor tab changes | `select` |
| Prompt Send / Build (Home composer, coder chat Send) | `press` |
| Segmented toggles: Web App / Mobile App, Pricing monthly / yearly | `select` |
| Switches (Appearance, Haptics, CMS switches, collection toggles) | `toggle(on)`, always light |
| Opening an app or template (Use template, Open app, guest app launch) | `tap` |
| Swiping templates on the product page: crossing halfway to another template | `select` (one per page crossed) |
| Running into either end of the product page's template list | `soft`, once per drag |
| Liking a template (the heart on a Home tile; none on un-like) | `toggle(true)` |
| A build or template finishing | `magic()`, a single `success` |
| A build or socket failing, a payment gateway error | `error` |
| Error and warning toasts | `error` / `warning`, fired by `toast.*` |
| Splash: the pencil snaps into the logo | one `soft` |

## Where haptics are not allowed

Ordinary rows, cards, links, icons, chips, header buttons, drawer items, sheet
and modal opens, closes and dismiss buttons, idea chips, carousel snaps,
scrolling, focus, typing, list renders, form validation, cart quantity changes,
drag-to-reorder, long press, success and info toasts, and swiping a toast away.

## The vocabulary

| Call | iOS | Android |
| --- | --- | --- |
| `haptic.select()` | selection | `SEGMENT_TICK` |
| `haptic.tap()` | light impact | `VIRTUAL_KEY` |
| `haptic.press()` | medium impact | `CONFIRM` |
| `haptic.soft()` | soft impact | `GESTURE_END` |
| `haptic.toggle(on)` | light impact | `TOGGLE_ON` / `TOGGLE_OFF` |
| `haptic.success()` / `warning()` / `error()` | notification | `CONFIRM` / `CONTEXT_CLICK` / `REJECT` |
| `haptic.magic()` | same as `success()` | same |

Android uses `performHapticFeedback` constants rather than raw vibration.
They are crisp, tuned by the system, and respect the phone's touch-feedback
setting.

## The splash

The splash (both themes) fires one `soft` haptic as the pencil snaps into
the logo, 3.43s in (`SPLASH_T.haptic` in
`src/components/splash/logo-splash.tsx`). Do not add more steps.

## Off switch

Settings → Haptics stores `HAPTICS_ENABLED` in MMKV, and haptics are on by
default. Every call checks it, so nothing else needs to.
