# Template category screen

`/category/[name]` shows every template in one category, or all of them, in
the same bento as Home's studio feed. It has search, a category slider and a
"browse all categories" side panel. The route is
`src/app/category/[name].tsx`, registered in `src/app/_layout.tsx` as a
normal stack push, so the back gesture works. The screen code is in
`src/containers/TemplateCategory/`.

## Opening it

```ts
import { openCategory, ALL_CATEGORIES } from '@/lib/category-route';

openCategory(router, 'Fashion & Apparel'); // one category
openCategory(router, ALL_CATEGORIES);      // every template ("All")
```

`openCategory(router: ReturnType<typeof useRouter>, name: string): void`
pushes `/category/<name>`, and expo-router URL-encodes the name. `name` is
the category exactly as the templates API spells it (`template.category`).
An empty name opens "All". A deep link works too:
`com.appsketch-ai.app://category/Fashion%20%26%20Apparel`.

## Layout

The bars are fixed at the top. They are a solid canvas, and a hairline
appears under them once the feed scrolls beneath.

1. **Top bar.**
   - **Back.** Uses `router.back()`, or replaces to `/home` if there is
     nothing to go back to.
   - **Search field.** Filters the current category as you type. Every word
     must appear in the title, description, tags or category. It has a clear
     button, and dragging the feed dismisses the keyboard. A new search
     starts at the top of its results.
   - **Browse all categories.** A grid icon that opens the side panel.
2. **Category slider.** "All" comes first, then every category by size, each
   with its count. The active chip is an ink pill and is scrolled to the
   middle of the rail.
3. **Title.** A big title such as "Fashion & Apparel", with "52 templates"
   under it. While searching, the line reads "12 of 52 templates match
   'red'". The title is the list's header. As you scroll it shrinks about
   its top-left corner, on the UI thread, and it never fades.
4. **Bento.** It uses Home's recipes (`Home/Studio/recipes.ts` `buildFeed`):
   3 columns, 8px side padding and 6px gaps. Phones sit in the silver frame
   and websites in browser sheets, on pastel stages. Shots are anchored
   top-left, every tile has press-scale, and rows rise in.
   - Home's black showcase is flattened into ordinary rows (`deal.ts`).
     Black chrome belongs to Home.
   - The list is a FlashList v2, recycled by each row's column signature.
   - Tapping a template calls `openTemplate` with `list` set to the
     filtered list in display order, so the product page swipes through
     exactly what you see.
   - Type tiles switch category in place.
   - "Create yours" goes back to Home.

## Switching category

A chip, a panel row or a type tile calls `setCategory`
(`use-category-nav.ts`), which does the following:
- keeps the category in the screen's own state. It does not touch the
  route: `router.setParams` on a path param adds a history entry, so back
  would step through every category you visited. One back (or swipe-back)
  always returns to where you came from. The `name` param only seeds the
  first category;
- clears the rise memory and jumps to the top, so the new deal rises in with
  a stagger;
- fires `haptic.select()` once, on a real change only. This is the screen's
  only haptic, apart from Home's own `tap` when a tile opens a template.

The search text is kept when you switch, so a query can be carried across
categories.

## Browse all categories panel

`browse-panel.tsx` and `panel-row.tsx`:
- **Size.** The panel is 82% of the screen width, at most 360pt. It slides
  in from the right with a 1.5px left edge and no shadow.
- **Rows.** "All templates" first, then every category. Each row shows three
  tiny top-left-anchored screenshots, the name and the count. The active row
  has an inset fill, an ink edge and a check.
- **Backdrop.** A `BlurView` whose intensity rises with the panel. It is an
  animated prop, not a dimming tint.
- **Motion.** One no-overshoot spring drives the panel and the blur.
- **Closing.** Tap the backdrop, press ×, swipe the panel right
  (gesture-handler Pan: more than 28% of its width or a fling), or press
  Android back.
- **Picking.** Picking a row selects that category and closes the panel.

## Live tiles

Large, site and wide tiles can play the real build, under the same rules as
Home: at most 2 WebViews, chosen 400ms after scrolling stops, at least 60%
visible, nearest the centre. They run in their **own** budget instance: `LiveBudget` is a class in
`Home/Studio/live-budget.ts`, Home uses the default `liveBudget`, and this
screen provides `categoryLive` (`use-category-nav.ts`) through
`LiveBudgetContext`. Home's tiles read the nearest budget with
`useIsLive`, so this screen never overwrites Home's spots. Home stays mounted underneath and keeps its spots
for when you return. The budget is paused when the screen blurs, when the
app is in the background, and when a tile opens a template
(`useOpenTemplate` pauses the nearest budget). There is no preview prewarm:
`src/lib/preview-prewarm.ts` and `mobilePreviewUrl()` were removed.

Live web tiles hide the web-runner's "Made with Appsketch" badge and bar
with `READY_SCRIPT` (`TemplateProduct/autoscroll-script.ts`). It re-adds its
style rule if hydration removes it, hides each chrome element inline, and
re-runs on load, on timers and on DOM mutations. The badge is also baked
into some CDN thumbnails (the backend's capture), so a static tile can
still show it until it goes live.

## Loading, empty and error

- **Loading.** Ghost tiles in the bento's own shapes, with one neutral light
  band flowing across them. There are no colour pools.
- **No search matches.** "Clear search", plus "Search all categories" when
  inside a category.
- **Unknown or empty category.** "See all templates".
- **Load failed.** "Try again" (refetch) and "Go back".

## Data

The screen uses the same react-query entry as Home
(`[...templateKeys.all, 'studio']`, `fetchCodeTemplates({ limit: 400 })`).
Coming from Home, it renders from cache in its first frame. The fetch in
`use-category-data.ts` must stay identical to `Home/Studio/use-studio.ts`,
because both write the same cache entry.

## Shared with Home (read-only imports)

From Home the screen imports:
- `geometry`, `recipes.buildFeed`, `studio-context` (`StudioContext`,
  `useOpenTemplate`, `stageOf`) and `live-site`;
- `RowCells` (Home's row view, with every tile type including the web tiles
  and browser frame);
- `LiveBudget` / `LiveBudgetContext` from `live-budget`.

There are no adapted copies. Only the row wrapper (`rows.tsx`) is the
screen's own, because the rise-in memory must reset on each category switch
without touching Home's.
