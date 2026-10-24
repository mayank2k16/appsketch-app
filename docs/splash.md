# Splash

The launch, from tap to `/welcome` (or `/home`), in both themes.

## The sequence

1. **Native launch screen: solid brand orange `#EB4709`, edge to edge.** It has no
   dot and no logo, and the status bar uses light content.
2. **The in-app splash** (`src/app/splash.tsx`, `src/components/splash/logo-splash.tsx`)
   plays `assets/lottie/splash-logo.json`, which runs 228 frames at 60fps (3.8s):
   - **0–1.0s, the opening.** Frame 0 is the same solid orange. After a 0.1s
     hold, the warm canvas `#FAFAF8` sweeps in clockwise from 12 o'clock, like
     a clock hand (ease-in-out, 0.1–0.87s). At the same time, the orange
     around the centre gathers into a shrinking disc. The last sliver of the
     sweep runs into that disc, which lands a touch small and settles on the
     16pt dot at the centre (1.0s).
   - **1.0–3.8s, the logo.** This is the original sequence, unchanged. The dot
     glides into place as the pencil flies in, the pencil draws the gradient
     frame and then the inner square, the dot pops, the pencil snaps in, the
     mark bounces, and a sheen crosses it.
3. Reanimated then lifts the mark, and `appsketch.ai` and the tagline rise
   (3.38s). They sink at 4.42s. The canvas irises shut into the mark
   (4.5–5.0s), and the app leaves the splash at 5.04s (`SPLASH_T` in
   `logo-splash.tsx`). One soft haptic fires as the pencil lands (3.43s). Tap
   anywhere to skip.

The status bar uses light content over the orange. It switches to dark
content at 0.3s (`SPLASH_T.statusDark`), once the sweep has passed the
status bar's right side. The clock side is still orange at that point, and
dark content reads fine on it.

## Why

The user asked that the launch should not start on an orange dot. It should
be fully orange, a white area should come in clockwise, the orange should
turn into the dot, and the pencil should then draw the logo from that dot as
before.

## How it is built

Everything comes from `scripts/make-splash-logo.py`. Do not hand-edit the
JSON. Run `python3 scripts/make-splash-logo.py`, which needs Pillow and
cairosvg.

- **Comp.** The outer comp is 1120×1440pt and is drawn 1:1 around the screen
  centre. It covers any portrait phone or iPad; iPad 13" is 1032×1376. The
  app is portrait-only. `logo-splash.tsx` centres a view of that size on the
  screen, and the screen clips it.
- **Sweep.** The orange left behind the sweep is an exact pie sector: a filled
  path made of the centre plus 4 cubic arcs, reaching past the comp corners
  and keyed every frame. A diagonal-wide trimmed stroke was tried first and
  rejected, because it left antialiasing specks on the solid frames.
- **Gather.** An ellipse at the centre shrinks from radius 200pt to 8pt, dips
  to 0.82× and settles back. It fades from `#EB4709` to `#FA8F32`, the logo's
  measured dot colour. `#F2600C` is only the wordmark accent.
- **Logo.** The original 480pt sequence is a precomp (`assets[0]`, `logo`)
  with a start offset of 60 frames. It is still clipped to its 480pt box, as
  the old comp was, so the pencil enters from that same edge. Rendered with
  lottie-web, frames 60+k match the old JSON's frame k pixel for pixel, and
  the gather disc at frame 59 matches the old frame 0 dot exactly.
- **Before the Lottie loads.** `logo-splash.tsx` shows a full-screen orange
  view (`SPLASH_ORANGE`) until `onAnimationLoaded` fires, with a 400ms
  safety. It used to show the dot PNG.

## Native files (no `prebuild --clean`: ios/ has hand changes)

| Where | What |
| --- | --- |
| `app.config.ts` `expo-splash-screen` | `backgroundColor: '#EB4709'`, `image: ./assets/splash-blank.png` (transparent) |
| `app.config.ts` `ios.infoPlist` | `UIStatusBarStyle: UIStatusBarStyleLightContent` |
| `plugins/with-splash-light-status-bar.js` | adds `android:windowLightStatusBar=false` to `Theme.App.SplashScreen`. It is listed before `expo-splash-screen`, because mods on one file run last-registered first |
| `ios/AppSketch/Images.xcassets/SplashScreenBackground.colorset`, `SplashScreen.storyboard` | orange |
| `ios/AppSketch/Images.xcassets/SplashScreenLogo.imageset/*.png` | transparent, written by the script |
| `ios/AppSketch/Info.plist` | `UIStatusBarStyleLightContent` |
| `android/.../values/colors.xml` `splashscreen_background` | `#EB4709` |
| `android/.../values/styles.xml` | `android:windowLightStatusBar=false` on the splash theme |
| `android/.../drawable-*/splashscreen_logo.png` | transparent 288dp PNGs, written by the script. They stay PNGs because `drawable/ic_launcher_background.xml` uses them as a `<bitmap>` src |

## Verifying without a device

Render frames with lottie-web in headless Chrome at 390×844 and 1024×1366,
and put them in a contact sheet. Check three things: frame 0 is 100% orange,
nothing but the dot remains after frame 52, and frames 60+ match the old
sequence. On-device timing and the native-to-Lottie handoff still need a
simulator or a phone. See also the memory note on Lottie splash device
gotchas: the exit race, `hideAsync`, and `onAnimationFinish(cancelled)`.
