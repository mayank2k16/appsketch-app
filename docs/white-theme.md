# Premium white theme

AppSketch is **white by default**. Dark is a setting, and it looks exactly as it
did before this change. The layouts are the same in both themes. Only the
colours change, plus the press feedback that every CTA now has.

## How the theme is chosen

- `src/lib/hooks/use-selected-theme.tsx` stores the choice in MMKV
  (`SELECTED_THEME`), and the default is `light`. `loadSelectedTheme()` applies
  it before React renders, so the first frame is already in the right theme.
- The switch lives in the drawer (**Appearance: White / Dark**) and in
  Settings → Theme.
- Screens read `const { colorScheme } = useColorScheme()` (nativewind), then
  `useAppTheme(colorScheme)`, `useCoderTheme(colorScheme)` or
  `useBrandedCoderTheme(colorScheme)`. Anything other than `'dark'` resolves to
  the white palette.
- Native shell:
  - The icon is `assets/icon.png`: an opaque warm-white canvas with the logo
    glyph. Android's adaptive icon uses `assets/adaptive-icon.png` on `#FAFAF8`.
  - The launch screen is solid brand orange `#EB4709` (no logo), in both
    themes; the in-app splash sweeps it clockwise to the warm canvas, gathers
    the orange into the logo's dot and draws the logo from it. Full details,
    timings and native files: `docs/splash.md`.
  - The in-app splash (`src/app/splash.tsx`,
    `src/components/splash/logo-splash.tsx`) is the same in both themes. After
    the 1s opening it plays the original logo sequence (60fps, 2.8s, shape
    layers only): the dot glides into its place
    as the pencil flies in; the graphite tip draws the outer frame (gradient
    stroke revealed by a trim path, the tip keyed to the trim head every
    frame, a faint highlight trailing it); it sketches the inner square and
    the dot pops; the pencil lifts, turns and grows into its place across
    the corner; the mark bounces once and a light sheen crosses it (alpha
    matte). The final frame matches `assets/splash-mark.png` (no vector
    source exists: geometry and gradients were fitted to the PNG, IoU 0.96).
    Then (Reanimated) the mark lifts 44pt, `appsketch.ai` (accent dot) and
    the tagline rise out of clipped slots, sink back at 4.4s, and the canvas
    irises shut into the mark (4.5–5.0s) onto the theme's canvas. One soft
    haptic as the pencil lands (3.43s). Tap to skip.
  - Signed out (or guest), the splash goes to `/welcome`
    (`src/containers/Welcome/`), which starts on that bare canvas: the tilted
    collage of 12 template screens (`src/components/splash/white-collage.tsx`,
    `assets/splash/`), the gradient icon, `appsketch.ai`, "Create unlimited
    beautiful apps.", then Continue with Google, Continue with phone or email
    (the AuthSheet OTP flow) and the terms line rise in from below. Skip
    (top right) browses as a guest. Dark has its own canvas and tile tones.
    Sign-out and session expiry also land on `/welcome`; `/login` stays for
    screens that push it to gate an action.
  - `userInterfaceStyle` is `automatic`, so alerts and the keyboard follow the
    choice.

## The rules for white

1. **No shadows, no glows, no blur tints.** Use `shadowOpacity: 0`, no
   `elevation`, and no coloured glow layers. Depth comes from three surface
   steps and one hairline. Keep shadows in dark wherever they already exist.
2. **Surfaces.** The canvas is `#FAFAF8` (`bg`). Raised surfaces are `#FFFFFF`
   (`surface`): cards, sheets and inputs. Inset surfaces are `#F4F4F2`: chips,
   rails, tracks and pressed rows. The hairline is `#E7E7E4` (`border`), 1px.
   Never use pure-black borders.
3. **Ink.**
   - Text is `#0B0B0C`.
   - Secondary text is `#5C5D63`.
   - Muted text and placeholders are `#9C9DA3`.
   - Primary buttons are ink-filled with white text.
4. **One accent.**
   - Orange `#F2600C` marks the single most important action on a screen: Use
     app, Open app, Send, Pay.
   - The brand gradient is only for the logo, a hero word, or the active tab
     icon.
   - Do not tint whole surfaces with colour.
5. **Status colours.**
   - Success is `#12A150`.
   - Error is `#E5484D`.
   - Warning is `#D97706`.
   - Use each at ~8% alpha for the background of its pill.
6. **Radius.** Keep each component's existing radius. Do not change layouts.
7. **No fades.** Text is solid: an ink heading never fades to grey. The brand
   ramp on a single hero word is a colour gradient, not a fade. Nothing fades
   to transparent over content or images. Where a sticky bar must hide
   scrolling content, it is a solid surface.
8. **Page background.** `AmbientBackground` (`@/components/ui/ambient-background`)
   goes first in a screen's root, and the root stays transparent in white. It
   is three light pastel gradients cross-faded on the UI thread (~9s per
   colour). It renders nothing in dark.
9. **Images over white.** Images get a 1px hairline frame instead of a shadow.
   Never overlay a dark gradient on an image just to make text legible: put the
   text below it instead.

## Interaction: no dead clicks

- Everything tappable uses `PressableScale` (`@/components/ui`). It gives a
  spring scale to 0.96. Haptics are opt-in (`haptic="select"` etc.) and kept
  for meaningful moments only; see `docs/haptics.md`. Pass `scaleTo={0.98}`
  for large cards.
- Every visible button, row, chip, icon and card must *do* something. Either
  wire it to a real route or action, or remove it. `onPress={() => {}}` is a
  bug.
- Show a disabled control at 50% opacity. Do not leave it looking enabled while
  it ignores taps.
- Use orange or ink spinners in white. Never use a white spinner on white.

## Home in white

Home is three things: the header, the hero with the prompt card, and the
template feed. The landing sections that used to follow (Showcase, How it
works, FAQ, Footer…) are no longer mounted. Their components remain in
`src/containers/Home/`.

- **Headline** (`Hero/index.tsx`, `WhiteHeading`): "Create unlimited" is
  solid ink. "beautiful apps." uses a deeper, saturated ramp (`#FF5A0A` →
  `#EE1B7E` → `#7B2FF2`), with no highlighter stroke. The dark ramp
  looked washed out on white. Dark keeps its own headline.
- **Dots** (`Hero/shifting-dots.tsx`): the dark grid (spacing 31, radius 1.1),
  its colour melting through orange → pink → lilac → sky. All instances read
  one wall clock, so the header's field and the hero band's field always
  match.
- **Template studio** (`Studio/`): "Made with AppSketch", the category rail
  (All plus each category, with counts, from one request for every published
  template), then a **3-column bento feed** in the style of an iOS widget
  stack. 8px outer padding, 6px gaps, 10px corners, hairlines, no shadows.
  - **Virtualised.** Home's scroll is a FlashList v2 (`Studio/feed-list.tsx`).
    The hero, prompt and studio head are its `ListHeaderComponent`. Each item
    is one bento row, recycled by recipe type. The scroll component is the
    keyboard-aware scroll view (`renderScrollComponent`), so the prompt still
    lifts above the keyboard.
  - **Rows are recipes** (`Studio/recipes.ts`) that always fill the 3 columns
    exactly. Recipes cycle in a fixed order; one the remaining templates cannot
    fill is skipped, and small tails finish the list, so there are no holes.
    The feed is deterministic. Tile kinds:
    - `phone`: one column, the silver frame filling it (three phones fit a
      row), name below;
    - `large`: 2 columns by a tall row. Category and title on a pastel stage,
      the site in a 16:10 browser sheet below;
    - `site`: 2 columns by a short row. The sheet rises off the stage's bottom;
    - `small`: one column, a crop of the top-left of the screenshot (every
      screenshot is anchored top-left, `contentPosition="top left"`, so
      websites read from their header);
    - `wide`: full width, a 16:10 browser sheet;
    - `type`: a category as one big word ("Fashion", "Food") on a pastel
      stage. Tapping it opens that category's screen
      (`openCategory(router, category)`, `src/lib/category-route.ts`). The
      rail chips still filter in place on Home;
    - `action`: "Create yours". It scrolls Home to the top and focuses the
      prompt (`AgentV2`'s `inputRef`).
  - **Tile footer: chips and likes** (`Studio/tile-meta.tsx`, `tags.ts`,
    `template-social.ts`). Under every phone / small / wide tile (and at the
    top of a site strip): the name with a heart and like count on its right,
    then colour-coded chips. `LABEL_H` grew from 22 to 62 (name row 16 +
    two chip lines, `CHIPS_H`), so every recipe height follows and rows
    still fill exactly. A large tile shows title + heart, then the chips
    (the category chip replaced its old category eyebrow).
    - **Chips** = the category in FULL ("Restaurants & Cafes"), then the
      API `tags`, cleaned for reading (`ecommerce` → "E-commerce", `hotel`
      → "Hotels", `saas` → "SaaS"). Gallery tags (mobile, new, featured,
      trending) and tags repeating the category are skipped. Never cut:
      chips wrap onto a second line; a chip that does not fit whole is left
      out (`chipsOf` estimates widths at ~6pt a character, erring wide);
      the category always shows (at most 3 chips), and if it alone is
      wider than a one-column tile it becomes a two-line chip, split at
      the most balanced word gap (`splitLabel`: "Construction &" /
      "Industrial"). Each line is its own one-line `Text`: iOS drew only
      the first line of a wrapped (or `\n`-broken) label in these chips.
    - **Colours** (`TemplateReel/pills.ts`, `pillTone`, shared with the
      product page's pills, so a label is one colour everywhere): first
      matching rule wins. Restaurants red, grocery / food green, real
      estate blue, hotels / resorts / travel teal, bookings and health sky,
      rides / cabs / mobility indigo, fashion fuchsia, jewellery / luxury /
      furniture / home amber, beauty / salon pink, events / media rose,
      agency / SaaS / AI violet, finance / consulting slate, e-commerce /
      electronics / gifts orange. White: soft tint, darker text, hairline
      in the hue. Black showcase and dark mode: the hue at ~18% with light
      text.
    - **Likes** come from the web gallery's endpoints: one
      `GET builder/gallery/social/` for every count (`{code: {id: {likes,
      comments, liked}}}`), `POST builder/gallery/<kind>/<id>/like/` with
      `{liked, visitor}` to like / take back. Anyone may like, as on the
      web: a signed-in account owns its likes, otherwise a random device id
      (MMKV `gallery-visitor`, sent in the body). The server reports
      `liked` for accounts only, so the device keeps the ids it liked
      (`gallery-liked`). Optimistic: heart and count flip at once, the
      server's answer sets the real count, a failure puts them back; a
      late answer to an older tap is ignored. One `toggle(true)` haptic on
      a like (none on un-like). If the counts cannot load, no heart is
      shown at all (never a dead heart).
  - **Card edges.** White tiles (the action tile, small tiles' media, browser
    sheets on the page) carry a 1.5px `#CFCFCA` border, a subtle
    `rgba(255,255,255,0.16)` in dark (`cardEdge()` / `CARD_EDGE_W` in
    `Studio/geometry.ts`). No shadows.
  - **One black showcase** (`Studio/showcase.tsx`). Once the rows above it
    are about 1.6 screens tall, ONE black section goes in; it is the only
    black in the feed. Head: "APPS AND WEBSITES" / "Built to feel like the
    real thing.", then a bento of apps AND websites in the same 3-column
    grid as the feed (8px sides, 6px gaps, exact fills): `SHOWCASE_PLAN` =
    phones trio, wide site, large site + phone, phones trio, phone + large
    site, wide site, phones trio (11 phones, 4 sites; about twice the old
    height). Rows the remaining templates cannot fill are dropped (at least
    2 are kept). Sites sit on a graphite stage in silver browser frames and
    can play live like the feed's (same budget). Then the "Create yours →"
    pill. **Three story cards** sit between its rows (after the first two
    rows, about 60% down, and after the last row; `interleave` in
    `recipes.ts`), App Store "Today" style (`story-card.tsx`,
    `story-art.tsx`, data in `stories.ts`):
    - Built to the App Store's "Happening now" card, measured off a
      screenshot and compared side by side: as wide as the masonry (its
      border lines up with the tiles' 8pt gutters); the layout is the
      App Store's at 350pt, scaled by `su()` (geometry.ts) — card 432,
      4.5pt border in the vivid tint, 20pt continuous corners, no shadow.
    - Tab inside the top-left corner (white caps, system font / SF Pro
      semibold, normal tracking) joined to the border, with two concave
      SVG fillets where it meets the art and a rounded bottom-right.
    - Art (`story-art.tsx`), the same for all three cards: a near-black
      top deepening into the vivid tint; three template screenshots
      (top-left crop) on off-white paper sheets, tilted +9° / −7° / +10°
      and overlapping (lead in the middle, right sheet in front); their
      lower part melts into the tint; white dots plus coral, mint and pink
      sparkles top-right. Static images only. One motion: the sheets float
      ±2pt (3.6s, UI thread, only while Home is focused).
    - Text on the flat vivid tint: eyebrow (light tint, caps), a two-line
      bold title, a one-line subtitle; then a band a shade darker: 48pt
      icon (thumbnail top-left), name (up to 2 lines), category line, a
      74×32 "View" pill (white 22%) with a caption ("Live preview" /
      "iOS & Android"). All in the system font, like the App Store.
    - Tints, in card order: violet (`#6C00CF`, the App Store's), copper
      (`#95571E`), crimson (`#B8123A`); each has a deep top, a band shade
      and a light text colour (`TINTS` in `stories.ts`).
    - Picking (`pickStories`): the fan is the biggest category with 3+
      templates (featured first), the phone card a featured app, the
      browser card a website tagged new — each from a category with 3
      templates for the sheets, and different categories where possible.
      Tabs are true to the data: "EDITOR'S PICK" only for an API-featured
      template, "NEW ARRIVAL" only for one tagged new (the website card
      says this first), "TRENDING NOW" only for a collection with a
      trending tag (else "COLLECTION" / "SPOTLIGHT"). Copy per category
      (generic fallback); subtitles are the template's own first sentence
      or a count.
    - Taps: the fan card opens the category screen (`openCategory`), the
      others the template's product page; the pill always opens the
      template, with its category as the swipe `list`. Press-scale on both.
    - The category screen flattens only the showcase's rows, so it shows no
      story cards.
    Its height comes from `showcaseHeight(blocks)` (rows and stories), and `feed.showcase`
    `{y, h}` drives the chrome tone. Taps open the product page with the
    category's full display order as `list`. While it passes, the header and the tab bar turn black with it. One
    UI-thread value, `chromeTone` (`src/lib/chrome-tone.ts`, 0 = page theme,
    1 = black), is derived from the scroll offset (`useScrollOffset` and
    `Studio/chrome-driver.ts`). The header and `GlowTabBar` read it with
    `interpolateColor`, so nothing re-renders per frame. Fills glide the
    whole way; text and glyphs cross over between 0.4 and 0.6 (`INK_AT`), so
    they never sit grey on grey. Each animated style must read
    `chromeTone.value` inside its own updater (not only in a shared helper),
    or Reanimated does not subscribe it. The status bar flips to light past
    0.5. Home re-asserts its bar style on focus, because expo-status-bar
    screens (the product page) set the style natively behind RN's stack.
    Home writes 0 when it blurs. In dark the change is subtle, because the
    chrome is already near black.
  - **Live sites.** `large`, `wide` and `site` tiles with a `preview_url`
    can play the real build. The WebView renders at a 1280px viewport,
    scaled into the sheet. It auto-scrolls (TemplateProduct's
    `autoscroll-script`) and takes no touches, so a tap opens the product
    page. It is anchored top-left and shows the full 1280px width, matching
    the 1280px screenshot underneath (no jump on the crossfade). It fades in
    on the page's "ready" message (fallback 0.7s after load). A tiny green "LIVE" tag marks it. The budget
    (`Studio/live-budget.ts`): **at most 2 WebViews at once**, chosen 400ms
    after scrolling stops (momentum included). Each chosen tile is at least
    60% visible above the tab bar and nearest the viewport centre, with big
    tiles first. A live tile is dropped as soon as it leaves the viewport.
    All live tiles go when a tile opens the product page, when Home blurs, or
    when the app backgrounds. Phone tiles never load or prewarm the app's
    `/preview/` render (the product page shows apps as screenshots).
  - **Motion.** Press-scale on every tile (`haptic="tap"` only on opening a
    template). A row rises in (translate and scale, no opacity) the first time
    it shows. A category switch resets this, so the new deal rises with a
    stagger. Tapping a tile measures its media and calls `openTemplate` with
    `list` = the category's templates in display order, so the product page
    can swipe through them.
- **Hide-on-scroll header** (`Home/header-collapse.ts`, `CollapsingHeader`
  in `Home/index.tsx`). The header overlays the list (the list keeps
  `headerH` of empty room above the hero, so nothing jumps at rest) and
  slides up with its dotted band once the feed's start has passed under it
  (translateY only, no fade). A diff-clamp on the UI-thread scroll offset
  follows the finger while the content goes up; a reverse scroll of more
  than 10pt springs it back in full, anywhere. Above the feed's start it is
  always shown. A drag or momentum that ends half way snaps it shown or
  hidden (`onScrollEndDrag` / `onMomentumScrollEnd`). A solid strip
  (page colour, black with `chromeTone`) fades in behind the status bar as
  it hides, so the feed never shows under the clock. The chrome tone
  thresholds are unchanged (they are measured from the header's bottom
  line), so a header revealed inside the showcase is black. "Create yours"
  reveals it before scrolling to the top. No React render per frame.
- **Tab bar**: a firm `#D3D3CE` border. The page hairline vanished on white.
  It follows `chromeTone` (see above), turning black with the showcase.

## Palettes

- App: `src/lib/theme/AppTheme.ts` (`appTheme.light`).
- Coder, Agent, Studio and Marketplace: `CoderTheme.ts` (light branch).
- CMS: `src/containers/CMS/theme`.
- Status bar: `appTheme.*.statusBar`, or `FocusAwareStatusBar`.
