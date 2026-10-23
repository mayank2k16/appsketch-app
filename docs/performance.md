# Home and category scroll performance

This pass made Home's masonry and the category screen stay smooth deep into
the feed. Nothing looks different; only how things are drawn changed. The
numbers below are from Release simulator builds (iPhone 16e) scrolled by a
temporary probe: 40 animated `scrollToOffset` steps of 0.9 screens, 420ms
apart, which covers about 36 screens in 19s. The UI-thread frames came from
`useFrameCallback`, the JS frames from a rAF loop, and memory from
`footprint <pid>`. The probe was removed afterwards.

## Results

**Home** (two runs of each build):

| | before | after |
|---|---|---|
| UI frames dropped over ~36 screens | 62 / 104 | 16 / 26 |
| UI frames over 50ms | 6 / 8 | 1 / 2 |
| UI fps during the scroll | 56.7 / 54.5 | 59.1 / 58.6 |
| JS frames dropped | 25 / 27 | 5 / 11 |
| Memory at rest on Home | ~875–950 MB | ~615–636 MB |
| Memory after the scroll | 1855 / 2295 MB (still climbing) | 884 / 894 MB (flat) |

**Category "All"** (12 identical flings): memory went from 215 MB to
1087 MB before the fix, and from 235 MB to 489 MB after. In the before
build, decoded images ("CG raster data") were 827 MB of that.

The category screen has no probe hook, because its files belong to another
work stream. Its frame rate was therefore checked by eye only, not measured.

## Root causes and fixes

1. **Full-size screenshots, shrunk on the main thread on every display.**
   - The API's thumbnails are full size: phones are 780×1688, which is
     5 MB decoded, and sites are 1280×800 or 1920×1200.
   - When an image is bigger than its view, expo-image (iOS) redraws it
     smaller with `UIGraphicsImageRenderer` on the main thread. It does this
     every time a tile shows the image, including memory-cache hits.
   - Its memory cache keeps the full-size bitmap and has no limit by default.
   - **Fix:** `Shot` takes `fit = { w, h, ratio }` (`TemplateReel/shot.tsx`).
     - The image view is sized to the screenshot's own cover size, so
       "fit" and "cover" are the same box, inside a clipping view anchored
       top-left as before.
     - It sets `enforceEarlyResizing`, so SDWebImage decodes straight to
       that pixel size in the background and caches the small bitmap.
     - `PhoneFrame`, `BrowserFrame` and `SmallTile` pass `fit`. Ratios are
       in `SHOT_RATIO`.
     - Shots without `fit` behave exactly as before. The product page and
       the category panel use those.
   - `Image.configureCache({ maxMemoryCost: 160 MB })` is set in
     `app/_layout.tsx`.
   - The feed's prefetch now goes to `'disk'`, not `'memory-disk'`. The
     tiles never use the full-size in-memory copies.

2. **Home's dot fields and colour pools.**
   - Before:
     - The white hero and header each ran `ShiftingDots`: 4 colours × 4
       full-size SVG layers, so 32 SVG backing stores.
     - The header's field was drawn screen-tall and then clipped to the
       header.
     - The ambient pools were 12 SVG radial gradients, each 1.25× the
       screen width square.
     - About 45 looping animations never stopped, even after the hero had
       scrolled away. The hero lives in the list header, which never
       unmounts.
   - Fixes:
     - The header field is drawn only header-tall. `gridHeight` keeps the
       grid laid out for the full screen, so every dot sits where it did.
     - `TwinkleDots` dropped its base grid. Each dot is in exactly one
       twinkle layer, and `1 - (1-base)(1-a)` is linear in `a`, so the
       layer alone with a remapped opacity range gives the same pixels.
       The layers now freeze instead of unmounting on blur, so coming back
       to Home redraws nothing.
     - The pools are one 256px white radial-gradient PNG
       (`assets/home/glow.png`), built from the same stops as the SVG
       (1 → 0.55 at 45% → 0). It is stretched and tinted with `tintColor`.
     - `on-screen.ts` holds UI-thread-driven flags: `hero`, `header` and
       `showcase`.
       - `feed-list.tsx` (`useZones`) and `CollapsingHeader`
         (`useHeaderDotsLive`) set them, only when a zone crosses the
         viewport edge.
       - The dot fields, the pools (`AmbientBackground live`) and the
         story-card floats (`story-art.tsx`) freeze while their zone is off
         screen.

3. **Re-renders.**
   - `metaTone()` returned a new object on every call, which defeated the
     `TileFoot` / `Heart` memo on every tile render. It now returns one
     shared object per theme.
   - `useLike` subscribed every heart to the whole counts map. It now uses
     a per-heart `select` (`template-social.ts`), so a refetch or one like
     re-renders one heart, not all of them.

## Still open

- Home is still about 615 MB at rest, mostly CoreAnimation backing stores.
  The biggest remaining items are:
  - the hero's 12 dot SVG layers, each about 393 × hero height at 3×;
  - the showcase spotlight SVG, which is full width × showcase height.

  A mask-based dot field (3 SVG masks over solid colour views) would cut
  roughly another 130 MB. It was not done because it changes the
  cross-fade's alpha math slightly and adds offscreen passes.
- Rise animations, FlashList `drawDistance` and `PressableScale` were
  looked at but not changed. The probe's per-step drops did not point at
  them.
- Dark mode uses the same code paths (its full-screen `TwinkleDots` also
  lost its base layer), but it was not screenshot-checked in this pass.

## Home bento fillers and the welcome reel (2026-10-23)

- **Type tiles** (`Home/Studio/word-tiles.tsx`): the big category word sits over
  a fan of up to 3 of that category's own screenshots, shown as white
  4pt-framed prints at 44×62. expo-image downsizes them to the view size, so
  each type tile adds only three tiny decodes. The thumbs come from
  `categoriesOf` (`use-studio.ts` / `use-category-data.ts`) through
  `TypeWord.thumbs`. The user asked for no icons and no iconic Lotties here.
- **Large site tiles** (`tiles.tsx` `Blurb`): the template description fills
  the room between the chips and the browser sheet, with as many whole
  15pt lines as fit. That count is measured once with onLayout and never
  leaves a clipped line.
- **Welcome collage** (`components/splash/white-collage.tsx`): the columns
  scroll endlessly as a reel (24 pt/s, alternate directions). Each column
  draws its screens twice and shifts by at most one set
  (`withRepeat(withTiming)`, linear, on the UI thread), so the wrap is
  seamless. Before, it drifted 30pt over 3s and stopped.
