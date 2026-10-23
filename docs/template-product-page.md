# Template product page

`/template/[key]` is the product page for one template. The page code is in
`src/containers/TemplateProduct/` and the route is `src/app/template/[key].tsx`
(a `transparentModal` with `animation: 'none'`, registered in
`src/app/_layout.tsx`).

## Layout

Two opaque stacked panels over a frosted backdrop. Each panel is the panel
colour (white light, `#111113` dark) with a 1.5pt ORANGE border in both
themes (`frame` = `appTheme.light.accent`, `#F2600C`, the app's accent),
continuous rounded corners and no shadows. The small controls (close X,
device pills) keep a neutral edge (`panelEdge`), so the orange reads as the
panels' frame only. The geometry is fixed in `geometry.ts`.

- **Backdrop** (`page-backdrop.tsx`). The centred template's own screenshot
  (`thumbnail_url`), scaled to cover the screen and blurred, under a frosted
  wash (white 30% light, black 38% dark). It is decoded and blurred at 1/8
  of the screen (`enforceEarlyResizing`, `blurRadius` 12) and magnified ×8
  by the GPU; on screen it matches the old full-size `blurRadius` 60.
  Because the panels are opaque, it only shows in the gaps: the 8pt
  gutters, the strip above the hero, the gap between the panels and the strip under
  the box. Each page in the ±1 window has its own layer whose opacity
  follows the pager position on the UI thread, so the gaps crossfade to the
  next template's colours as you swipe (no per-frame JS). A template with no
  screenshot uses its loader palette as a gradient.
- **Breadcrumbs** (`bread-crumbs.tsx`). A 22pt row under the status bar:
  `Templates › <Category> › <Name>`, one line, 12.5pt. The name truncates;
  "Templates" and the category never do. "Templates" pops back to Home
  (`router.dismissTo('/home')`). The category goes back from this page and
  pushes its category screen (`openCategory`), so one back from there
  returns to where the page was opened from, never into a loop. The name is
  a solid chip in the panel colour with its edge, bold ink text (plain muted
  text vanished on light blurred backdrops). A segment that changes as you swipe fades in (160ms).
- **Template panel (top).** From under the breadcrumbs, 8pt in from both
  edges. The details box starts at 72% of the screen height + 52pt; the
  panel takes everything above it except the gaps below.
  - A **website** (anything with a web `preview_url`, ecosystem or not)
    shows its live site, interactive (see below). Its panel ends above a
    slim pills row: 6pt gap, a 32pt capsule, 6pt gap.
  - A **mobile app** (`app_type === 'mobile'`) shows only its screenshot
    (`hero-shot.tsx`): no WebView, no LIVE, no device pills. With no pills
    row, its panel runs down to a plain 8pt above the box (`g.heroTall`), so
    app and website panels differ in height as you swipe.
- **Close X** (`hero-chrome.tsx`). A 34pt panel-coloured circle with the
  1.5pt panel border, inside the panel's top-left corner (10pt in). It stays
  put while the pager moves and follows a pull-down. It covers the top-left
  34pt of the site (a site's own top-left hamburger can sit under it).
- **Pills row** (websites only). One centred capsule: the **LIVE** status
  (grey dot while the site loads, then a pulsing green one) and the
  **Mobile | Tablet | Desktop** switch; Mobile is the default (user request,
  23 Oct 2026 — lightest load, smoother swipes; Desktop was the default
  before). ‹ and › capsules sit at the row's two ends and page to the
  previous / next template (`stepPage` in use-pager.ts: same spring, haptics
  and debounced settle as a swipe; dimmed at the list's ends, a tap there
  bumps). Mobile lays out at the panel's own width with no
  transform (native scrolling); Tablet / Desktop render at 820 / 1280 CSS px
  and are scaled down with an RN transform. A viewport-meta approach
  (`width=1280` injected before content, letting WebKit zoom natively) was
  tried and REJECTED: this WKWebView ignores the meta (innerWidth stayed
  371), and `contentMode="desktop"` didn't change that.
- **Details box (bottom).** Down to the home indicator, at least 188pt tall
  (on short phones the panel shrinks instead). It never
  scrolls. It shows:
  - the name (one line, truncated) and "3 / 52 · Swipe ›" beside it, never
    overlapping. The count is the position within the template's CATEGORY
    (it goes "7 / 7" → "1 / 52" as you swipe into the next category); the
    "Swipe" cue goes after the first swipe;
  - the category, kind and Featured pills, and a **More** button;
  - a two-line description, or "category · tags" when the template has
    none; nothing if it has neither;
  - the CTAs: *Try it live* or *Run it live* or *Preview site*, and *Use this
    template* or *Use ecosystem* (`use-ctas.ts`, wired as in the Market).
    For apps, *Run it live* (the in-app host) is the primary CTA.
- **More** (`more-sheet.tsx`) opens a card over the box: the full
  description, the tags and an ecosystem's apps (`template-info.tsx`). Tap
  outside it or press Done to close it.

## The hero

`live-url.ts`:

| Template | Hero |
| --- | --- |
| Web code app | its live build, `buildUrl(preview_url)` = `https://appsketch.ai/builds/<uuid>` (no trailing slash: the slash form answers with a 308, one wasted round trip) |
| Mobile app (`isAppShot` = `app_type === 'mobile'`) | the screenshot only (`thumbOf`) |
| Layout template | none; the panel says "No live preview for this template" |

**Why apps show a screenshot.** The web-runner can render an Expo app at
`/preview/<uuid>/`, but a cold one holds the HTML for 7-42s while Metro
starts, then builds a ~9MB dev bundle (`cache-control: no-store`) for
another ~17s. Measured on the simulator, a cold app took 14-45s to show.
The page does not load or prewarm `/preview/` at all; *Run it live* runs the
real app natively.

**App screenshot** (`hero-shot.tsx`). A vertical `ScrollView` with an
expo-image at the panel's full width and the image's natural aspect ratio
(from `onLoad`), anchored top-left, and never shorter than the panel: a
short image is cropped by `cover`, so the panel is always filled (no
letterbox, no white band). The hero's pager pan is horizontal-only,
so up/down scrolls the screenshot and left/right still pages. The loader
shows until the image decodes, then the image fades in over 200ms.
Neighbours' screenshots are prefetched (`Image.prefetch`) when a page
settles, and the ±1 neighbours render theirs at once, so a swipe lands on a
decoded image. Only the centred page scrolls.

**Live site** (`live-preview.tsx`):
- The WebView renders at the real CSS width of the chosen device (390
  Mobile, 820 Tablet, 1280 Desktop) and is scaled to the panel's INSIDE
  width (hero width minus the 2 × 1.5pt border, which clips the content)
  with `transformOrigin: 'top left'`, so the site lays itself out as on that
  device and touches map correctly at every width. Before this the scale
  used the outer width and ~11 CSS px of a Desktop site's right edge hid
  under the border.
- **Exactly one viewport wide.** `FIT_SCRIPT` (injected first) adds a
  `width=device-width` viewport meta when the page has none and sets
  `html,body{overflow-x:clip}`, so one over-wide element cannot make the
  site lay out wider than 1280 and push its header's right end out of the
  panel. `clip` rather than `hidden` keeps sticky headers working.
- **It is interactive.** It scrolls vertically and taps work; navigation
  stays inside the WebView (no link previews). The pager's pan claims only
  horizontal moves (`activeOffsetX ±18`, `failOffsetY ±10`), so vertical
  scrolls go to the site.
- It does NOT auto-scroll any more (removed 23 Oct 2026 at the user's
  request; `autoScrollScript` is still used by Home's Studio live site).
- **Sideways drags never reach the site** (`SWIPE_GUARD_SCRIPT`):
  `touch-action: pan-y` on `<html>` stops WebKit's horizontal panning, and a
  passive capture listener on window swallows (`stopImmediatePropagation`)
  the touch/pointer moves of a drag that went sideways first, so the site's
  own carousels don't run under a page swipe. REJECTED: also calling
  `preventDefault` on those touchmoves — WebKit then claims the touch and
  the native pager's pan fails (hero swipes stopped paging on the sim).
- **Never half-rendered.** `READY_SCRIPT` (`autoscroll-script.ts`) polls
  every 80ms and posts `{"as":"ready"}` only once the first screen has
  painted: the body has real content, `document.readyState` is `complete`,
  `document.fonts.ready` has resolved and every image in the first viewport
  is `complete`. It is capped at 2.5s after load (a slow image cannot hold
  the site back) and 15s overall, never posts for a meta-refresh stub, and
  waits two animation frames before posting. Only then does the site fade
  in over the loader, in 200ms (opacity only). There is no onLoadEnd
  fallback on the product page.
- `cacheEnabled` / `cacheMode="LOAD_DEFAULT"`: repeat opens reuse the
  build's immutable assets from the WebView cache.
- **Switching device** (Mobile / Tablet / Desktop) answers in the tap's
  frame: the switch thumb springs and the new width mounts on top at once.
  Until it has painted (the same `READY_SCRIPT` message, so the 2.5s image
  cap applies), the old viewport stays under a `DotVeil`: a 22-intensity
  blur plus a 42% white (dark: graphite) wash, with the dot ripple on a
  soft frosted chip in the centre. The veil sits UNDER the new layer, so the
  new site's own 200ms fade is the crossfade; when it finishes the old
  viewport and the veil go in the same frame. Going back to a viewport that
  is still mounted and painted just drops the other one (no veil). The
  stack (`layers`, `ready`) lives in `LivePreview`'s `pick` / `painted`.
- The same script hides AppSketch's "Made with Appsketch" badge and bar.

**Loading timeline (website).** The centred page mounts its WebView at once,
during the grow animation (it does not wait for landing). Its neighbours
mount theirs hidden and paused (`load: 'warm'`) once the centred site is
live, or 2.5s after the page settles if it never goes live — the NEXT page
first, the previous one 350ms later, and each only while the pager is
still (a mount during a drag or the settle spring waits); a page that
already rendered stays loaded when you swipe back. At most the ±1 window,
three WebViews, exists. Measured on the simulator (tap → site visible):
5.7s before, 1.8-2.5s after (measured before the stricter "painted" check,
which can add up to the 2.5s cap on image-heavy sites); a warm neighbour is live the moment it lands.
Landing is detected with a threshold (`LANDED_AT = 0.997` in
`use-product-transition.ts`) rather than the spring's finished callback,
which only fired ~4s after the panel visibly landed.

**Loader.** A website's panel rests on the **dot ripple** (`dot-loader.tsx`,
`DotSurface`): a round cluster of 21 brand-orange (`#F2600C`) dots, the Home
hero's dot grid gathered up (5 × 5 at a 12pt pitch, corners dropped, 5pt
dots) on a soft `#FAFAF9` (dark `#141416`) surface. A ripple runs out from
the centre every 1.5s; each dot swells (0.55 → 1.3) and brightens
(0.2 → 1) as the crest passes (cos of phase − distance, cubed, so it reads
as a crisp ring). One `withRepeat` clock per cluster; every dot's style is
derived from it on the UI thread (no per-dot timers, no JS per frame).
Only the centred page animates it. The grow flies the same dot surface
(still) for a website. Apps keep the flowing gradient (`live-loader.tsx`,
tinted per template key) under the screenshot's quick image fade. A cold open that is still fetching the
template shows the same loader plus a skeleton details box (`not-found.tsx`).

## Swiping between templates

`use-resolved-template.ts` → `swipeList()` builds one list, grouped by
category (`groups`: name, start, size):
- First the tapped template's category, in the tile's list order (else the
  studio list's).
- Then every other category, biggest first (Home's rail order), each in the
  studio list's order, so continuous swiping never dead-ends. The studio
  react-query cache (`[...templateKeys.all, 'studio']`, or one cold fetch on
  a deep link) is the pool.
- Only templates with a hero (`hasHero`: a live site, or a mobile app's
  screenshot). Swiping left from the first template of its category stops
  at that category's start (nothing comes before it).
- The breadcrumb and counter follow the centred page's group.

How the pager works (`use-pager.ts`):
- `x` is the continuous page position. Each page derives its offset from it
  on the UI thread: one stride less a 4pt PEEK, so exactly 4pt of each
  neighbour shows at the screen edges (after the 4pt gap that keeps the
  8pt outer layout). At rest that sliver is a deck edge: the neighbour's
  orange border plus a solid strip of its loader colour (an overlay that
  fades in as the page leaves the centre, from |d| 0.6 to 1). It also
  derives a slight scale about the near edge. There is NO motion blur
  (removed Oct 23 at the user's request: mid-swipe and landing frames read
  as a blurred, low-res page; it also cost a live effect layer per card).
  The details panels cross-fade with a short parallax.
- One swipe moves at most one page.
- Pages ±2 (`WINDOW`) around the SETTLED page are rendered (off-centre
  ones without a WebView), so a second quick swipe always finds its page.
- WebViews: see the loading timeline above. The release settles after a
  fixed 380ms (`SETTLE_MS`), not the spring callback.
- **Hint.** Once per app session, 600ms after the open finishes, the page
  nudges 24pt toward the next template and springs back.
- **Haptics.** Picker-style, following the finger: one `select` tick the
  moment a drag crosses halfway to another template (and back), one on
  release if a fling lands on a page not ticked yet, and one `soft` bump per
  drag at either end of the list.
- **Claiming the swipe over a live site.** The hero's pan uses manual
  activation from raw touches: ≥7pt sideways that leads the vertical claims
  it; ≥8pt vertical that is clearly MORE than the sideways (×1.2) gives it
  to the site. (Oct 23: the old rule — claim only if dx > 1.3·dy, yield at
  any 8pt vertical — handed a natural thumb arc to the site, so first
  swipes often did nothing.) It must decide before WKWebView's own
  scroll pan starts (~10pt); with `activeOffsetX(18)` the site won every
  drag and sideways swipes only nudged the page.
- **Debounced commit.** A release only updates the light chrome (`index`:
  breadcrumb, LIVE badge, details touch target). The page window, every
  hero's `load` and the warm neighbours follow `settled`, committed
  SETTLE_MS after the LAST release (a run of quick swipes commits once),
  or at once when a swipe reaches the window's edge. The drag is clamped on
  the UI thread to the mounted window (`span`). Before, every release
  re-rendered and mounted a new neighbour card in the spring's first frames.
- **Smooth landing.** WebViews never mount or unmount while the spring runs:
  the rendered window stays put until `settled`,
  neighbours warm around the settled page, and a page that had no WebView
  gets one only after it settles. The loader under a site stops animating once the site is live,
  and a loader that is not animating is plain views (no animated styles).
- **Recovery.** A killed web process (`onContentProcessDidTerminate`,
  Android `onRenderProcessGone` — the classic blank white WebView) remounts
  the layer; a 4xx/5xx or network error shows "Preview unavailable" + Retry.
- Taps on the template panel go to the site (or scroll the screenshot);
  they no longer run the primary CTA.
- A pull down on the details box closes the page.
- **Always lands centred.** Only a HORIZONTAL drag takes `x` over
  (`cancelAnimation` + start position in `onStart` run only when the drag
  starts horizontal). Before, a vertical pull on the details box started
  right after a swipe cancelled the page's settle spring and nothing
  restarted it, so the page stayed between pages: panel shifted right, a
  ~20px neighbour strip instead of 4px. `onFinalize` is a safety net: a
  horizontal drag that ends without `onEnd` (cancelled by the WebView's own
  gesture) springs `x` back to the committed page. A device switch never
  touches `x` or the geometry.

## Open and close

- **From a tile.** Call `openTemplate(router, { template, rect, frame, list })`
  from `src/lib/template-transition.ts`. The tile's rect grows into the
  template panel (`grow-overlay.tsx`). The flying surface is the same blurred
  loader the panel shows, not a screenshot. On landing, the overlay hides in
  the same frame the panel appears. The live site then fades in once it is
  ready. The page background and the details box fade and rise in alongside.
- **Cold open.** A deep link opens the page with a fade and a rise, for
  example `com.appsketch-ai.app://template/code-11589` (web) or
  `…/template/code-11641` (mobile).
- **Close.** Use the X, a pull down on the details box, or Android back.
  If the page still shows the template the tile opened, the panel shrinks
  back onto the tile. Otherwise the page fades and scales out. The page then
  calls `clearPendingTemplate(key)` and `router.back()`, or replaces to
  `/home` if it cannot go back.

## Prewarming

None for apps. Home and the product page no longer fetch `/preview/<uuid>/`
on press-in, on screen or for neighbours. (`src/lib/preview-prewarm.ts`
remains only because the category screen, `src/containers/TemplateCategory/`,
still calls it.)

## Performance (Oct 2026 pass)

PAGE_SPRING is damping 32 / stiffness 340 (was 26 / 220: snappier
landing, still no overshoot).

Measured on a Release simulator build (iPhone 16e sim), Plinth Desktop,
12 fast swipes (8 forward, then back/forth), with a temporary UI-thread
frame sampler (`useFrameCallback`, dropped frames per swipe split into
drag / spring / settle) and a JS rAF gap sampler; both removed afterwards.
Xcode's Animation Hitches instrument does not run on the simulator ("Hitches
is not supported on this platform"), so Time Profiler was used for causes.

| | before | after |
| --- | --- | --- |
| dropped frames, 12 swipes | 58 (6.5% of frames) | 11 (1.3%) |
| swipes with a >50ms frame | 4 | 0 |
| worst UI frame | 266ms | 44ms |
| worst JS-thread gap | 97ms | 32ms |
| reveal | 200ms fade, unchanged | 200ms fade |

Root causes and fixes:
- **Loader gradients drawn on the CPU at giant sizes** (the big hitches,
  150-270ms, whenever a mobile-app page entered the ±1 window).
  `LiveLoader`'s two `Flow` gradients are 3 × 3 panels; expo-linear-gradient
  draws its layer on the main thread at screen scale — ~3300 × 5600 px
  (~74 MB) each. Time Profiler showed `argb32_shade_axial_RGB` /
  `LinearGradientLayer.display` filling those windows. Now every loader
  gradient is drawn at 1/12 size and magnified (`CheapGradient`); a smooth
  gradient looks identical.
- **Animated blur intensity.** expo-blur's `intensity` setter calls
  `setNeedsDisplay`, and its `draw(_:)` builds a new
  `UIViewPropertyAnimator` — every frame, for every moving card, plus a
  shadow-tree commit per frame for the non-style prop. Now the blur has a
  fixed intensity and only its wrapper's opacity animates.
- **21 animated dot styles per card.** Every card mounted its dot cluster
  with 21 `useAnimatedStyle`s even when still (all neighbours). A still
  cluster is now plain views; only the centred loading page animates.
- **Hidden neighbours auto-scrolling** (see the auto-scroll bullet): two
  offscreen WebViews committed layer trees every frame on the main thread.
- **Neighbour WebViews mounting together, right at settle** (warm sites
  were already live, so both mounted in the settle frame). Now staggered
  and only when still.
- **Backdrop blur on the full-size screenshot** (see Backdrop).

Rejected / not done:
- Reanimated's `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` static flag would take
  every animated opacity/transform off the per-frame shadow-tree commit
  (`ReanimatedModuleProxy::commitUpdates` was ~16% of main-thread time) —
  but it is an app-wide native flag (package.json + pod install) shared
  with the Home work and the debug build, so it was left as a
  recommendation.
- `shouldRasterizeIOS` on the scaled Desktop WebView: the site keeps
  painting (auto-scroll), so the cache would be invalidated every frame.
- Replacing the motion blur with a dim or a pre-blurred screenshot: the
  fixed-intensity blur faded by opacity looked the same and was enough.

The "blink" after a site loads was checked frame by frame (30fps screen
recordings): our reveal is a clean monotonic 200ms fade; what follows on
Plinth is the site's own intro animation. The part that was ours was the
auto-scroll's uneven whole-pixel cadence (now eased, sub-pixel). Real-device
feel (120Hz ProMotion, GPU cost of the blur over a WebView) cannot be
proven on the simulator.
