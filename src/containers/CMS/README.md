# CMS — architecture & how to add a tab

This is the merchant-facing CMS (order management, inventory, notifications, …), ported from
the Vite web reference at `V:\Phurti-Work\aiktech-frontend\Vite\src\Containers\Cms`, adapted for
mobile. Entry point: `/cms` (`src/app/cms/`), reached today via Studio's "View CMS" flow
(`src/containers/Studio`).

**Read this before adding a new tab.** It exists so a new tab looks and behaves exactly like the
existing ones — same shell, same kit, same API layering — without re-deriving the pattern from
scratch or drifting from it.

## Quick orientation

```
src/containers/CMS/
├── CmsShell.tsx              # Entry point — owns activeTab, renders the top bar + drawer
├── CmsDrawer.tsx             # Slide-in tab switcher (top-level tabs only)
├── tabs.tsx                  # CMS_TABS registry — THE place to register a new top-level tab
├── components/                # Shared CMS UI kit — see "The kit" below
├── theme/                     # useCmsTheme(), 5 switchable palettes, typography scale
├── Orders/                    # A top-level tab: Screen + components/ + utils.ts
├── Inventory/                 # A top-level tab: Screen + components/ + index.tsx barrel
└── Notifications/              # A top-level tab that is ITSELF a nested shell — see below
    ├── NotificationsScreen.tsx  # Nested shell — same recipe as CmsShell, one level deeper
    ├── tabs.tsx                  # NOTIFICATION_TABS registry
    ├── Channels/, Variables/, EmailTemplates/, SmsTemplates/, Customers/, Logs/
    └── index.tsx
```

**Core architectural rule: tabs are conditionally *mounted*, never routed.** There is exactly one
Expo Router screen for the whole CMS (`src/app/cms/index.tsx` → `CmsShell`). Switching tabs is a
`useState` change that swaps which tab's component is rendered — nothing else's data-fetching
effects run while it's inactive. This was a deliberate choice over per-tab route files or
`React.lazy` — see the git history / PR description for `CmsShell.tsx` if you want the full
reasoning; the short version is it matches how many tabs this needs to scale to (Vite's reference
has ~29) without a route explosion or Suspense edge cases.

## The two-level shell pattern

**Level 1 — `CmsShell.tsx` + `tabs.tsx` (`CMS_TABS`)**: the top bar (back button, active tab
title, theme switcher, hamburger) plus `CmsDrawer` for switching between top-level tabs (Orders,
Inventory, Notifications, …).

**Level 2 — a tab that has sub-sections of its own** (so far only `Notifications`, which mirrors
Vite's 8-sub-tab structure) **repeats the exact same recipe one level deeper**: its own
`<Feature>Screen.tsx` owns `activeTab` state and a horizontal sub-tab strip instead of opening the
main drawer again, and its own `tabs.tsx` registry (`NOTIFICATION_TABS`). If a new top-level tab
you're adding has multiple sub-sections, copy `Notifications/NotificationsScreen.tsx` +
`Notifications/tabs.tsx` as the template, not `CmsShell.tsx` directly (the sub-tab strip is a
`ScrollView`, not a drawer — see the note in `NotificationsScreen.tsx` about `flexGrow: 0` on that
`ScrollView`; forgetting it makes the strip stretch to fill the screen instead of staying a
compact row — this actually happened once, worth avoiding twice).

### Adding a new top-level tab — checklist

1. Build `src/containers/CMS/<Tab>/`Screen.tsx` (+ `components/` for its Row/Card/Modal pieces, +
   `index.tsx` barrel exporting both default and named).
2. Add one entry to `CMS_TABS` in `src/containers/CMS/tabs.tsx` — `key`, `label`, an Ionicons
   `icon` name, `Component`. That's the entire wiring; no new route, no drawer changes (the drawer
   renders off this array).
3. Your screen's top-level component signature must be `({ onMenuPress }: { onMenuPress: () =>
   void })` to satisfy `CmsTab['Component']` — but **don't render your own hamburger/title/theme
   switcher**. `CmsShell`'s top bar already owns those; your screen only renders its own
   tab-specific actions (e.g. Orders' notification-bell toggle + Create button). Accept the prop,
   alias it to `_onMenuPress` if unused, matching every existing screen.
4. If your tab needs sub-sections, see the two-level pattern above instead of stuffing everything
   into one screen.

### Adding a new Notifications sub-tab — checklist

Same as above but one level down: build `Notifications/<SubTab>/`, add one entry to
`NOTIFICATION_TABS` in `Notifications/tabs.tsx`. Sub-tab components take no props (`Component:
React.ComponentType`, no `onMenuPress` — there's no drawer at this level, just the sub-tab strip).

## The kit (`src/containers/CMS/components/`)

**Every CMS screen is built on this kit — never on `@/components/ui` (the app-wide shared
components).** The reason isn't cosmetic: `@/components/ui`'s `Text`/`Input`/`Button` hardcode a
NativeWind `font-inter` class, but `Inter` is never actually loaded as a font asset anywhere in
this app (only ProximaNova is, via `useFonts()` in `src/app/_layout.tsx`) — so building CMS forms
from those components means CMS's font rendering depends on an accident of platform font-fallback
behavior instead of being intentional. The kit is plain `StyleSheet`, system font by construction,
and themed via `useCmsTheme()` so it automatically follows whichever of the 5 CMS palettes
(Ocean Blue/Slack Classic/Emerald Fresh/Charcoal Gray/Midnight Indigo) is active — `@/components/ui`
has no concept of CMS theming at all.

| Component | Use for |
|---|---|
| `CmsModal` | Every bottom sheet. Wraps `@gorhom/bottom-sheet` directly (not `@/components/ui`'s `Modal`) so the header is theme-colored and never Inter-branded. `title`, `snapPoints`, forwards `ref`. |
| `CmsCard` | Bordered/padded/rounded section container. Optional `title` draws the uppercase section-title treatment. |
| `CmsField` | Read-only label/value pair (detail views — see `OrderDetailModal` for the reference usage). Renders nothing if `value` is empty. |
| `CmsSummaryRow` | Label/value money row, `bold` prop for totals. |
| `CmsInput` | Labeled text field for forms. `label` is optional (omit for a bare field next to a picker). |
| `CmsVariableInput` | Multiline field with `{{variable}}` autocomplete — only needed if your tab lets users write templated text (see `EmailTemplates`/`SmsTemplates`). |
| `CmsButton` | `variant: 'primary' \| 'ghost' \| 'danger'`. `primary` fills with the active theme's accent color — this is *the* fix for the recurring bug where a submit button rendered in the app's fixed brand color instead of the CMS palette. |
| `CmsSelect` | Plain dropdown (opens a `CmsModal` list). |
| `CmsSwitch` | Boolean toggle row — thin wrapper over RN's native `Switch`, tracked in the theme accent color. |
| `CmsStatusBadge` | Colored status pill. Takes a `{label, color, kind}` meta object — each domain owns its own string→meta mapping (see `Orders/utils.ts`'s `getOrderStatusMeta`, `Notifications/Logs/utils.ts`'s `getLogStatusMeta`) and just renders the result here. Don't build a per-tab copy of this — extend the shared one. |

**Named, documented exceptions** (things it's correct to keep using from `@/components/ui`):
- `SearchableSelect` — for genuine search-as-you-type pickers (customer/product lookups in
  `CreateOrderModal`). Rebuilding that debounced-search behavior in the kit wasn't worth it for
  what's currently a two-call-site need.
- `ConfirmModal` + `useModal` — a generic confirm dialog and the `{ref, present, dismiss}` hook for
  `BottomSheetModal`. Neither carries a font or CMS-theming concern (the hook is pure ref
  management; `ConfirmModal`'s copy is neutral enough), so there's no `Cms`-prefixed replacement.

`cms-typography.ts` (`src/containers/CMS/theme/cms-typography.ts`) is the one font-scale reference
— `sectionTitle`, `fieldLabel`/`fieldValue`, `summaryLabel`/`summaryValue` (+ `Bold` variants),
`inputLabel`/`inputValue`/`inputError`, `buttonLabel`, `listTitle`/`listSubtitle`/`listMeta`/
`listBadge`, `modalTitle`. The kit components and every list-card row reference these instead of
hardcoding their own numbers — if you need a new size, add a named token here rather than a
one-off magic number in your screen's `StyleSheet`.

## Theming

`useCmsTheme()` (`src/containers/CMS/theme/use-cms-theme.ts`) returns `{ colors, themeName,
setTheme }`. Always destructure `colors` and pass it down explicitly as a `colors` prop to
sub-components (that's the established pattern — see any existing Row/Card/Modal component's
props) rather than having every leaf component call the hook itself; keeps re-render scope
predictable and matches what's already there.

CMS's theme system is **deliberately separate from the app's global theme** — Studio (the
account/store-picker screen that links into CMS) intentionally uses the app's own brand palette
instead, since it's part of the main account experience, not the CMS shell. Don't try to unify
these; it's an intentional split, not an oversight.

## API layer conventions (`src/api/<domain>/`)

Every domain (`orders`, `inventory`, `notifications`, …) follows the same four-file shape:

```
src/api/<domain>/
├── types.ts          # Request/response/entity types, plain — no logic
├── client.ts          # Raw axios calls via `authenticatedClient`, one function per endpoint
├── use-<domain>.ts    # React Query hooks — one per operation, no screen-level aggregator
└── index.ts            # export * from './client'; export * from './types'; export * from './use-<domain>';
```

Then add `export * from './<domain>';` to `src/api/index.tsx`.

- **Client calls use `authenticatedClient`** from `@/api/common/client` (tenant-scoped base URL —
  already includes the tenant path segment, so paths are relative: `api/dashboard/orders/`,
  `api/notifications/logs/`, etc.). This does **not** match Vite's literal paths one-for-one —
  Vite's account-level backend mounts things under `/account/dashboard/...`; this app's
  tenant-scoped mount doesn't take that prefix. When porting a new Vite tab, drop the
  `account/dashboard`/`account` prefix and keep the rest (confirmed against Orders' and
  Inventory's already-working endpoints — don't guess, check a sibling domain's `client.ts` for
  the pattern actually in use).
- **Query keys**: a `<domain>Keys` object per file (`orderKeys`, `notificationKeys`, …), each
  entry a function returning a tuple starting with the domain name, so cache scoping and
  invalidation stay predictable. Follow the existing shape in any `use-<domain>.ts`.
- **Mutations**: `useMutation` with `onSuccess` → `toast.success(...)` +
  `queryClient.invalidateQueries({queryKey: ...})`, `onError` → `toast.error(...)`. Every existing
  create/update/delete hook follows this exact shape — copy one rather than inventing a variant.
- **Watch for naming collisions across domains.** `src/api/orders/types.ts` has a narrow
  `InventoryOption` (`{id, address}`, a dropdown-lookup shape for order creation) that is *not*
  the same thing as `src/api/inventory/types.ts`'s full `InventoryLocation` CRUD entity — same
  underlying backend concept, two different endpoints/shapes for two different consumers. When
  adding a new domain, grep for your intended export names across `src/api/*/` first; everything
  re-exports through the flat `src/api/index.tsx` barrel, so a collision is a compile error, not a
  silent shadow.

## Screen conventions

- **List + CRUD tab** = `<Tab>Screen.tsx` (list, loading/empty states, "Add" action) +
  `components/<Entity>Row.tsx` (or `Card.tsx` — a mobile card, never a literal port of Vite's
  desktop table) + `components/Manage<Entity>Modal.tsx` (one modal for both add and edit — `Boolean(selected)`
  decides the mode, see any `Manage*Modal.tsx` for the shape) + `ConfirmModal` for delete.
- Each screen owns its own `useModal()` instances (one per modal) and `useState` for
  "currently editing/deleting X" — this is intentionally simple local state, not lifted into a
  store; every existing tab does it this way.
- Platform-default / read-only records (Vite's `tenant === null` convention — e.g. default email/
  SMS templates) stay visible in the list but their manage-modal renders as read-only
  (`editable={false}` on the kit inputs) rather than being hidden — see `EmailTemplates`/
  `SmsTemplates` for the reference implementation.

## Known gotchas

- **`@gorhom/bottom-sheet` must stay ≥ 5.1.3** (currently pinned `^5.2.14`). Versions before that
  crash on web with `findNodeHandle is not supported on web` — a real upstream bug
  ([gorhom/react-native-bottom-sheet#2237](https://github.com/gorhom/react-native-bottom-sheet/issues/2237)),
  not a config issue. Don't downgrade without re-checking that issue's resolution.
- **`react-native-webview` has no web implementation.** Any use of it (currently only
  `ManageEmailTemplateModal`'s Preview tab) must guard with a `Platform.OS !== 'web'` check and
  provide a non-crashing fallback — see that file for the pattern (`WebView` resolved via a
  conditional `require`, `null` on web, fallback UI shown instead).
- **`src/app/_layout.tsx`'s root `Stack`** needs an explicit `<Stack.Screen name="cms"
  options={{headerShown: false}}/>` entry (already present) — without it, React Navigation's
  default header renders a stray back-bar above `CmsShell`'s own top bar. If you ever add another
  top-level route that CMS-like screens live under, remember this.

## Porting a new tab from the Vite reference

The Vite source for whatever you're porting lives under
`V:\Phurti-Work\aiktech-frontend\Vite\src\Containers\Cms\<Tab>`. Before writing any RN code, read
it fully and identify: the API calls (`Api/*.js` — note these are Redux-saga-dispatched in Vite;
this port uses React Query instead, no Redux anywhere in CMS), the entity shape, and anything
desktop-only that needs a mobile adaptation (dense CSS-grid tables → cards, `Prev/Next` pagination
→ infinite-scroll/pull-to-refresh or a simple full-fetch if the list is small like the existing
tabs do, hover tooltips → tap targets, `datetime-local` inputs → a native picker, side-by-side
split panes → a tab toggle like `EmailTemplates`' Edit/Preview). Then follow the checklists above.
