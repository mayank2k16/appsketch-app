# CMS — architecture & how to add a tab

This is the merchant-facing CMS (order management, inventory, notifications, …), ported from
the Vite web reference at `V:\Phurti-Work\aiktech-frontend\Vite\src\Containers\Cms`, adapted for
mobile. Entry point: `/cms` (`src/app/cms/`), reached today via Studio's "View CMS" flow
(`src/containers/Studio`).

**Read this before adding a new tab.** It exists so a new tab looks and behaves exactly like the
existing ones — same shell, same kit, same API layering — without re-deriving the pattern from
scratch or drifting from it.

## Progress

Ported so far (top-level `CMS_TABS` entries in `tabs.tsx`, each with its own `src/api/<domain>/`):

| Vite source folder(s) | RN tab | API domain |
|---|---|---|
| `Orders` | `Orders/` | `orders` |
| `Inventory` | `Inventory/` | `inventory` |
| `Invoices` | `Invoices/` | `invoices` |
| `Categories` | `Categories/` | `categories` |
| `Collections` | `Collections/` | `collections` |
| `DiscountCodes` | `Discounts/` | `discounts` |
| `Notifications` | `Notifications/` (8 sub-tabs) | `notifications` |
| `Payments` | `Payments/` (3 sub-tabs) | `payments` |
| `Wallets` | `Wallets/` | `wallets` |
| `Analytics` (marketing site analytics) | `Analytics/` | `analytics` |
| `Products` | `Products/` | `products` |
| `ReferralRules` + `Referrals` (merged) | `ReferAndEarn/` (3 sub-tabs) | `referrals` |
| `AddUser` | `Users/` | `users` |
| `StockHistory` | `StockHistory/` | `stock-history` |
| `AiAssistant` | `AiAssistant/` | `ai-assistant` |
| `Vendors` (marketplace-only) | `Vendors/` | `vendors` |
| `Support` | `Support/` | `support` |

**Not yet ported** (folders still under the Vite `Cms/` root with no RN counterpart — same
"read fully, check for dead code, plan first" treatment applies to each): `AddContent`,
`AddSellableInventory`, `AddStock`, `Bookings`, `Challan`, `CreditDebitNote`, `Dashboard`,
`DeliveryPincodes`, `DeliverySettings`, `Doctors`, `Ledger`, `MyCompany`, `ProductsRequest`,
`RateContract`, `Ride`. None of these have been explored yet — don't assume scope or complexity
from the name alone.

## Quick orientation

```
src/containers/CMS/
├── CmsShell.tsx              # Entry point — owns activeTab, renders the top bar + drawer
├── CmsDrawer.tsx             # Slide-in tab switcher (top-level tabs only)
├── tabs.tsx                  # CMS_TABS registry — THE place to register a new top-level tab
├── components/                # Shared CMS UI kit — see "The kit" below
├── theme/                     # useCmsTheme(), 5 switchable palettes, typography scale
├── Orders/                    # A flat top-level tab: Screen + components/ + utils.ts
├── Inventory/                 # A flat top-level tab: Screen + components/ + index.tsx barrel
├── Notifications/              # A top-level tab that is ITSELF a nested shell — see below
│   ├── NotificationsScreen.tsx  # Nested shell — same recipe as CmsShell, one level deeper
│   ├── tabs.tsx                  # NOTIFICATION_TABS registry
│   ├── Channels/, Variables/, EmailTemplates/, SmsTemplates/, Customers/, Logs/, Rules/
│   └── index.tsx
├── ReferAndEarn/                # A nested-shell tab MERGED from two separate Vite tabs — see below
│   ├── ReferAndEarnScreen.tsx
│   ├── tabs.tsx                  # REFER_AND_EARN_TABS: Rules | Referrals | LinkSettings
│   └── Rules/, ReferralsList/, LinkSettings/
└── AiAssistant/, Support/       # Realtime (WebSocket) tabs — a third architecture, no React Query — see below
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

**Level 2 — a tab that has sub-sections of its own** (`Notifications`, `Payments`, `ReferAndEarn`
so far) **repeats the exact same recipe one level deeper**: its own `<Feature>Screen.tsx` owns
`activeTab` state and a horizontal sub-tab strip instead of opening the main drawer again, and its
own `tabs.tsx` registry. If a new top-level tab you're adding has multiple sub-sections, copy
`Payments/PaymentsScreen.tsx` + `Payments/tabs.tsx` as the template (or `Notifications`'), not
`CmsShell.tsx` directly (the sub-tab strip is a `ScrollView`, not a drawer — see the note about
`flexGrow: 0` on that `ScrollView`; forgetting it makes the strip stretch to fill the screen
instead of staying a compact row — this actually happened once, worth avoiding twice).

### Merging multiple Vite tabs into one nested-shell tab

Vite doesn't always keep a conceptually-single feature in one folder. `ReferralRules` and
`Referrals` were two entirely separate top-level Vite tabs/folders, but Vite's own `SideBar.jsx`
already grouped them under one expandable sidebar menu — a strong signal they belong together on
mobile too. When you find this (check the sidebar's menu grouping, not just the folder structure),
merge them into one nested-shell tab the same way `ReferAndEarn/` does: one `src/api/<domain>/`
covering every sub-tab's entities (matches how `notifications`/`payments` already do it for a
single Vite tab with multiple sub-sections), one `tabs.tsx` registry, sub-tab folders named for
what they *do*, not for which original Vite folder they came from.

It also cuts the other way: `Referrals.jsx` alone did three jobs on one Vite page (analytics +
leaderboard, a paginated table, *and* an accordion-collapsed settings form). Split those into
separate sub-tabs (`ReferralsList/`, `LinkSettings/`) rather than porting the accordion — same
reasoning as the two-pane → drill-down adaptations below: one screen shouldn't juggle stats +
table + settings-form on a phone.

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

### Adding a new Notifications/Payments/ReferAndEarn sub-tab — checklist

Same as above but one level down: build `<ParentTab>/<SubTab>/`, add one entry to that parent's own
`*_TABS` array in its `tabs.tsx`. Sub-tab components take no props (`Component:
React.ComponentType`, no `onMenuPress` — there's no drawer at this level, just the sub-tab strip).

## Real-time (WebSocket) tabs — a third architecture

`AiAssistant/` and `Support/` don't fit the CRUD-with-a-drawer shape at all — they're live chat
UIs (a business-data Q&A agent, and a customer-support inbox) with no meaningful request/response
caching to do. For a tab like this:

- **No `use-<domain>.ts` React Query hooks file for the live stream.** `src/api/<domain>/` still
  gets `types.ts`/`client.ts`/`index.ts`, but `client.ts` only wraps the plain REST endpoints
  (list threads, send-as-fallback, mark-read, …) plus a `build*SocketUrl()` / `*SocketUrl()`
  function. The screen manages the actual `WebSocket` connection, message list, and typing/presence
  state with plain `useState`/`useRef` — same as Vite does (no Redux there either).
- **Auth token rides the query string, not a header.** RN's `WebSocket`, like the browser's, can't
  set custom headers on the handshake. `wss://…/ws/<path>/?token=<jwt>` — see
  `src/api/ai-assistant/client.ts`'s `buildChatWebSocketUrl` or `src/api/support/client.ts`'s
  `supportInboxSocketUrl`/`supportRoomSocketUrl`.
- **Check each Vite screen's actual reconnect behavior — don't assume the last one you ported.**
  `AiAssistant.jsx` has no reconnect logic at all (`onclose` just flips `connected` to false).
  `Support.jsx` has real exponential-backoff reconnect on *two* sockets (a tenant-wide inbox socket
  + a per-conversation room socket), capped at 15s. Port whichever one the source actually has —
  read the specific file, don't pattern-match from memory.
- **Two-pane realtime UIs (inbox + active conversation) become one screen with two states**, not a
  bottom sheet — see "Mobile layout adaptations" below.

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
| `CmsModal` | Every bottom sheet. Wraps `@gorhom/bottom-sheet` directly (not `@/components/ui`'s `Modal`) so the header is theme-colored and never Inter-branded. `title`, `snapPoints`, forwards `ref`. **Nesting is safe** — a `CmsModal` opened from inside another `CmsModal`'s content works fine (`@gorhom/bottom-sheet` portals each one independently). Used repeatedly: `CategoryMultiSelect` inside `ManageProductModal`, `LinkProductSheet` inside `ManageCategoryModal`, `ProductPickerSheet` inside `ManageCollectionModal`, `ManageCommissionModal` inside `VendorDetailSheet`. |
| `CmsCard` | Bordered/padded/rounded section container. Optional `title` draws the uppercase section-title treatment. |
| `CmsField` | Read-only label/value pair (detail views — see `OrderDetailModal` for the reference usage). Renders nothing if `value` is empty. |
| `CmsSummaryRow` | Label/value money row, `bold` prop for totals. |
| `CmsInput` | Labeled text field for forms. `label` is optional (omit for a bare field next to a picker). Its prop type `Omit<TextInputProps, 'style'>` — **it has no `style` prop**, don't try to pass one (compile error); it's not re-added. For date/time fields, there's no native date/time picker anywhere in this port — use a plain `CmsInput` with a `"(YYYY-MM-DDTHH:mm)"` or `"(YYYY-MM-DD)"` hint baked into the `label`/`placeholder` (see `Invoices`' `ManageInvoiceModal`, `ReferAndEarn/Rules`' `ManageRuleModal`, `Vendors`' `ManageCommissionModal`) — a deliberate, consistent simplification, not a one-off. |
| `CmsVariableInput` | Multiline field with `{{variable}}` autocomplete — only needed if your tab lets users write templated text (see `EmailTemplates`/`SmsTemplates`). |
| `CmsButton` | `variant: 'primary' \| 'ghost' \| 'danger'`. `primary` fills with the active theme's accent color — this is *the* fix for the recurring bug where a submit button rendered in the app's fixed brand color instead of the CMS palette. |
| `CmsSelect` | Plain dropdown (opens a `CmsModal` list). **No `disabled` prop** — if you need a Vite field that's conditionally disabled (e.g. a reward-type select that's locked out for milestone-trigger rules), wrap it in a `<View style={disabled ? {opacity:0.5} : undefined} pointerEvents={disabled ? 'none' : 'auto'}>` instead (see `ReferAndEarn/Rules/components/ManageRuleModal.tsx`'s referee-reward group) — just dimming it without `pointerEvents:'none'` still lets the sheet open. |
| `CmsSwitch` | Boolean toggle row — thin wrapper over RN's native `Switch`, tracked in the theme accent color. |
| `CmsStatusBadge` | Colored status pill. Takes a `{label, color, kind}` meta object — each domain owns its own string→meta mapping (see `Orders/utils.ts`'s `getOrderStatusMeta`, `Notifications/Logs/utils.ts`'s `getLogStatusMeta`, `Vendors/utils.ts`'s `getVendorStatusMeta`) and just renders the result here. Don't build a per-tab copy of this — extend the shared one. |

**Named, documented exceptions** (things it's correct to keep using from `@/components/ui`):
- `SearchableSelect` — for genuine search-as-you-type pickers (customer/product lookups in
  `CreateOrderModal`, invoice/entity pickers in `Payments`). Rebuilding that debounced-search
  behavior in the kit wasn't worth it.
- `ConfirmModal` + `useModal` — a generic confirm dialog and the `{ref, present, dismiss}` hook for
  `BottomSheetModal`. Neither carries a font or CMS-theming concern (the hook is pure ref
  management; `ConfirmModal`'s copy is neutral enough), so there's no `Cms`-prefixed replacement.

**Multi-select checkbox-list-in-a-`CmsModal` pickers stay per-tab, even past the 3rd copy.**
`Products/components/CategoryMultiSelect.tsx` was the first (its own comment says so explicitly).
`Discounts/components/ScopedItemsMultiSelect.tsx` (generic `{id,label}` version) and
`Users/components/GroupsPermissionsMultiSelect.tsx` followed with near-identical code. None of
these were consolidated into the shared kit — if you need a 4th, copy one of these rather than
either duplicating from scratch or unilaterally promoting the pattern into `components/`; only
do that consolidation if explicitly asked to.

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
  `account/dashboard`/`account` prefix and keep the rest. **But check each endpoint's actual
  prefix in the Vite source before assuming this rule applies** — plenty of endpoints (everything
  under `/shop/...`, `/referrals/admin/...`, `/support/...`) were never prefixed with
  `account/dashboard` in Vite to begin with, so there's nothing to strip; just carry the path
  through literally. Don't guess either way — grep the actual `Api/*.js` source.

- **Response shape is frequently inconsistent on the same endpoint family — always defend for it.**
  A very common backend pattern across this whole CMS: a list endpoint returns a bare array *or*
  `{results: [...]}` *or* `{data: [...]}` depending on whether the view applies pagination that
  day. Vite's own screens already defend against this (`Array.isArray(data) ? data :
  (data?.results ?? data?.data ?? [])`-style checks) — port the same defensive unwrap, don't
  assume one shape. Seen in `Invoices` (`fetch_invoices`), `Users` (`fetchProfiles`/`fetchStaff`),
  `Vendors` (`fetchVendorsList`), `Support` (`fetchConversations`/`fetchConversation`), `Discounts`
  (`fetchDiscounts`), `ReferAndEarn/Rules` (`fetchReferralRules`). If you write a
  `'data' in data ? data.data : data`-style narrowing against a `{data?: T} | T` union where `T`
  has no discriminant field, **TypeScript won't narrow it correctly** — write an explicit type
  guard/helper instead (see `src/api/support/client.ts`'s `unwrapEnvelope`).

- **The same endpoint can return a *different* shape depending on which query params you send.**
  `Invoices`' `/shop/invoices` returns `{results:[...]}` when paginated with `limit`/`offset`, but
  a bare array when queried with `searchKey` instead — two different client functions
  (`fetchInvoices` vs `searchInvoiceRecords`), not one that tries to handle both.

- **Query keys**: a `<domain>Keys` object per file (`orderKeys`, `notificationKeys`, …), each
  entry a function returning a tuple starting with the domain name, so cache scoping and
  invalidation stay predictable. Follow the existing shape in any `use-<domain>.ts`.

- **Mutations**: `useMutation` with `onSuccess` → `toast.success(...)` +
  `queryClient.invalidateQueries({queryKey: ...})`, `onError` → `toast.error(...)`. Every existing
  create/update/delete hook follows this exact shape — copy one rather than inventing a variant.

- **Watch for naming collisions across domains — grep before you name anything.** Everything
  re-exports through the flat `src/api/index.tsx` barrel (`export * from './<domain>'` for every
  domain), so a duplicate export name is a hard compile error, not a silent shadow. This has come
  up repeatedly, always for the same reason — the *same real-world concept* surfaced through a
  *different endpoint* for a *different consumer*:
  - `orders`' narrow `InventoryOption` (`{id,address}`, order-creation dropdown) vs `inventory`'s
    full `InventoryLocation` CRUD entity.
  - `invoices`' `InvoiceInventoryOption` (`{id,name}`, from `/shop/inventories/`) vs `orders`'
    `InventoryOption` vs `users`' `UserInventoryOption` (from `/dashboard/inventory/`) — **three**
    different shapes/endpoints for "which store/warehouse," one per consuming tab.
  - `orders` already exports `useDiscounts`/`fetchDiscounts` (its own order-creation discount
    dropdown) — the `discounts` domain's equivalents are named `useDiscountCodes`/
    `fetchDiscountCodes` instead.
  - `home` already exports `fetchCategories`/`useCategories` (the public storefront's flat
    category browser) — the `categories` domain's admin *tree* fetcher is named
    `fetchCategoryTree`/`useCategoryTree` instead.
  - `payments` already exports `searchInvoices` (a narrow `{id,invoice_id}` picker) — the
    `invoices` domain's own richer search is named `searchInvoiceRecords` instead.

  Before naming a new export, run a quick grep across `src/api/*/` for the name you're about to
  use. If it's taken by a genuinely different shape/consumer, rename yours to something
  domain-specific rather than either colliding or trying to unify the two call sites.

- **Real gap: there is no "current tenant ID" concept anywhere in this app.** Every domain ported
  so far relies purely on `authenticatedClient`'s auth-token interceptor for tenant scoping — no
  endpoint needs an explicit tenant ID in the request. Two Vite endpoints break that assumption:
  `Vendors`' `fetchVendorsList`/`vendorRequestAction` need a tenant ID as a literal **URL path
  segment** (`/dashboard/{tenantId}/vendors/`), and `Support`'s WebSocket URLs append an optional
  `?tenant=` hint. Checked every plausible source (`useAuth` token/user state, the `tenants`
  domain, `env.js`, the CMS route entry) — nothing exists. Current workaround (see
  `src/api/vendors/client.ts`'s `getTenantId` / `src/api/support/client.ts`'s `getTenantHint`):
  read `useAuth.getState().user?.tenant_id` (falling back to `tenant_uuid`/`tenant`) at call time,
  clearly commented as an **unverified guess at the field name** — `AuthUser` is typed as an
  opaque `Record<string, unknown>` (`src/api/auth/types.ts`), so this can't be confirmed
  statically. If you hit another endpoint that needs a tenant ID, reuse this same lookup rather
  than inventing a new guess, and flag it the same way. This will need a real fix (either typing
  `AuthUser` properly once the actual field is known, or a dedicated tenant-context source) once
  there's a live session to test against.

## Screen conventions

- **List + CRUD tab** = `<Tab>Screen.tsx` (list, loading/empty states, "Add" action) +
  `components/<Entity>Row.tsx` (or `Card.tsx` — a mobile card, never a literal port of Vite's
  desktop table) + `components/Manage<Entity>Modal.tsx` (one modal for both add and edit — `Boolean(selected)`
  decides the mode, see any `Manage*Modal.tsx` for the shape) + `ConfirmModal` for delete.
- Each screen owns its own `useModal()` instances (one per modal) and `useState` for
  "currently editing/deleting X" — this is intentionally simple local state, not lifted into a
  store; every existing tab does it this way. For a create/edit modal that needs to fully reset
  between "create new" invocations (not just switch to a different edit target), key the reset
  effect off an incrementing `openKey` number bumped every time the modal is opened, not just off
  the entity id/`null` — two back-to-back "create" taps both look like `id === null`, so an
  id-only dependency won't re-fire the reset. See any `ManageXModal`'s `useEffect(() => {...},
  [openKey, isEdit, entity])`.
- Platform-default / read-only records (Vite's `tenant === null` convention — e.g. default email/
  SMS templates) stay visible in the list but their manage-modal renders as read-only
  (`editable={false}` on the kit inputs) rather than being hidden — see `EmailTemplates`/
  `SmsTemplates` for the reference implementation.
- Delete confirmations use `ConfirmModal` — single attempt + error toast, even where Vite has a
  defensive multi-attempt retry loop with backoff around the delete call (e.g. `Categories`'
  `ContentCard.jsx` retries subcategory deletion 3×). That kind of defensive retry around a plain
  DELETE call is worth simplifying away, not porting faithfully — same category of call as fixing
  a real bug rather than reproducing it (see "dead code" below).

## Finding dead code before you port a tab

Before writing any RN code, grep the **entire** `Vite/src` tree (not just the tab's own folder)
for imports of every file/subfolder under the tab you're porting. Vite's CMS has accumulated a lot
of superseded scaffolding — old versions of a modal left behind after a rewrite, an entire
`AddModal/`+`DeleteModal/`+`Tables/` subtree nobody imports because the live screen became
self-contained, an import that's present but never actually called. This has been true for nearly
every tab ported so far, sometimes trivially (one leftover file) and sometimes massively
(`AddUser`'s live `AddUser.jsx` is fully self-contained — its own inline table, modal, and toggle
switch — and doesn't import any of `AddModal/`, `DeleteModal/`, or either `Tables/*UserTable`
subfolder at all).

Two distinct kinds of dead code to look for:
1. **Unreachable files** — nothing in the whole repo imports them. Confirm with a repo-wide grep
   for the filename/path, not just a look inside the tab folder (a same-named-but-unrelated file
   can exist elsewhere, e.g. `Invoices/ChallanCard.jsx` vs the unrelated
   `Challan/ChallanTable/ChallanCard.jsx`).
2. **Reachable but never triggered** — imported and rendered, but nothing in the component ever
   actually opens/enables it. E.g. `Invoices`' `ViewPurchaseModal` is imported and conditionally
   rendered on `openPurchaseModal`, but no code path ever calls `setOpenPurchaseModal(true)`.
   `Discounts`' "Apply On" dropdown offers "Challans"/"Logistics" options that fetch a picker list
   but have no corresponding key in the save payload — selections are silently dropped. Vite's own
   `DiscountCode.jsx` payload builder doesn't even have a `discount_attributes.challan` field.

When you find either kind, **don't port it** — call it out explicitly in the implementation plan
(with the specific evidence: "grepped the whole tree, nothing imports X" / "no code path calls
`setShowY(true)`"), and only replicate a *fixed* version if the underlying feature is real but
broken (see the delete-retry-loop and search-invoice-response-shape notes above) — not the bug
itself.

## Mobile layout adaptations — a catalog

Vite's CMS is desktop-first (permanent split panes, sidebars, hover states). None of these map
1:1 to a phone screen. The adaptations below are all already-established precedent — don't
re-litigate the same judgment call from scratch each time a new tab has one of these shapes:

- **Permanent two-pane split (list + detail, side by side) → drill-down within one screen.**
  `Categories` (tree left / products right) and `Support` (conversation list left / active chat
  right) both do this: one screen holds `activeId`-style state and conditionally renders the list
  view *or* the detail view, never both. A header back-button returns to the list. This is
  different from a bottom sheet — the detail pane deserves full screen real estate, it's not a
  quick picker.
- **Sidebar submenu grouping multiple sub-pages → nested-shell tab with a sub-tab strip.**
  `Payments` (Regular/Bulk/Vendor Settlements), `Notifications` (8 sub-tabs), `ReferAndEarn`
  (merged from two Vite tabs the sidebar already grouped) — see "The two-level shell pattern"
  above.
- **One page doing analytics + a table + a settings accordion → split into separate sub-tabs.**
  `ReferAndEarn`'s `LinkSettings` was pulled out of `Referrals.jsx`'s single overloaded page for
  exactly this reason.
- **A quick secondary picker (link a product, pick from a list) → a `CmsModal` bottom sheet**, not
  a full screen — `LinkProductSheet`, `ProductPickerSheet`, the multi-select pickers cataloged
  above. The distinction from the first bullet is scale: a picker is a means to an end inside a
  larger flow; a detail/conversation view is a destination in itself.
- **Native `<input type="color">` (3-mode: hex/RGB/native picker) → hex text field + live swatch
  only.** No new color-picker dependency for one field — `Categories`' `ManageCategoryModal`,
  `ReferAndEarn/LinkSettings`. Applies to any future colour field too.
- **CSV/Excel export buttons → dropped, not ported**, when the feature would need new
  file-system/share-sheet dependencies for what's a secondary desktop-download convenience (`Users`
  tab's CSV/XLSX export). If a tab's export feature looks load-bearing rather than a nicety, ask
  before dropping it — this was a judgment call confirmed with the user for `Users`, not a blanket
  rule to apply silently everywhere.

## Platform capability gaps (not simplifications) — check existing deps first

A few Vite features use browser/web-only APIs with no RN equivalent at all — these aren't UX
trims, they're hard platform gaps requiring an actual reimplementation. In every case so far, the
RN substitute used a dependency **already installed** in `package.json` (check before assuming you
need to add one):

- `dangerouslySetInnerHTML` (rendering a small markdown-ish HTML subset) → no RN equivalent at
  all. `AiAssistant/components/AiRichText.tsx` reimplements the exact same parsing rules (bold,
  inline code, GFM pipe tables, line breaks) as real `Text`/`View` trees instead of an HTML string.
- `recharts` (web-only SVG charts) → `react-native-gifted-charts`, already a dependency, already
  used by `Analytics/components/*Chart*.tsx`. `AiAssistant/components/AiChart.tsx` maps an
  agent-generated `{type,x,series,data}` spec onto it. Note: gifted-charts doesn't compose
  arbitrary multi-series lines/bars the way `recharts` does from one flat data array — a
  multi-measure spec charts only the first measure, disclosed as a known limitation rather than
  silently dropped.
- HTML5 `<video controls>` → `expo-video`'s `useVideoPlayer`/`VideoView`. Was already a listed
  dependency but genuinely unused anywhere in the app until `Support/components/MessageBubble.tsx`
  used it for inline playback of chat video attachments.
- Web Audio API (`AudioContext`, synthesizing a notification chime) → `expo-haptics`
  (`Haptics.notificationAsync`), already a dependency, already used once in
  `src/lib/store/cart-store.tsx`. Arguably more idiomatic for mobile than an audio tone anyway —
  `Support/components/ConversationsList.tsx`'s new-message cue.

If you hit a genuine platform gap like this, check `package.json` for something already installed
before reaching for a new package.

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
- **No marketplace/multi-tenant support anywhere in this app.** Vite's CMS has real
  marketplace-tenant features (a parent tenant approving/managing sub-vendor tenants, per-vendor
  commissions, marketplace-only invoice types, marketplace-scoped category/discount filtering).
  appsketch-app has no such hierarchy today — drop marketplace-only *pieces* while keeping the
  rest of a tab (dropped in `Invoices`, `Categories`, `Discounts`, `Payments`'s Vendor Settlements
  scope). `Vendors` was the one case where an *entire* tab is marketplace-gated in Vite
  (`SideBar.jsx`: only rendered when `tenantType === "marketplace"`) — built anyway on explicit
  request, readying the CMS ahead of marketplace support landing, with the tenant-ID gap above
  flagged as an explicit follow-up. Default to dropping marketplace-only scope unless told
  otherwise; when in doubt, ask rather than assume either way.

## Verification

There's no live backend session/credentials available to click through a tab end-to-end from this
environment, and browser-based dev-server checks are skipped by default per the current
metered-connection preference (ask if you want them re-enabled for a given session). The practical
verification bar used throughout this port:

1. `npx tsc --noEmit`, saved to a scratch file, **diffed against a baseline captured before your
   change** (`diff /tmp/tscout-before.txt /tmp/tscout-after.txt`) — not just "no errors," but
   *zero new errors and the output is byte-identical modulo your change*. This has reliably caught
   real regressions (see the naming-collision fixes above) without needing a running app.
2. Re-read what you just wrote once before calling it done — this session caught several
   self-introduced bugs this way: a broken double-return component draft, a `${action}d` string
   bug that mangled "reject" into "rejectd", a `useEffect` that could never fire because its guard
   condition was already checked earlier in the same function, an invalid TS comparison between a
   `number` and a `string` field.
3. Hand off the actual live click-through to whoever has a real session — say so explicitly rather
   than claiming it works from static analysis alone.

## Porting a new tab from the Vite reference

The Vite source for whatever you're porting lives under
`V:\Phurti-Work\aiktech-frontend\Vite\src\Containers\Cms\<Tab>`. Workflow that's worked well
across every tab so far:

1. **Read the tab's Vite source fully** — every file, not just the main screen component.
2. **Grep the whole Vite `src` tree** for imports of each file in the tab to find dead code (see
   "Finding dead code" above) — this is not optional, it's found something in almost every tab.
3. **Check whether appsketch-app already has a reusable pattern or domain** for something the tab
   needs before building fresh — an existing product/entity/inventory fetcher in a sibling domain,
   an existing multi-select/picker component, an existing chart/media capability already
   installed. Re-deriving something that already exists elsewhere in this port is wasted work.
4. **Identify genuine platform gaps vs. simplifiable desktop-only UX** — a hard capability gap
   (no `dangerouslySetInnerHTML`, no `<video>` tag) needs an actual reimplementation; a
   desktop-only convenience (dense CSS-grid tables → cards, hover tooltips → tap targets,
   `Prev/Next` pagination → infinite-scroll, split panes → drill-down/nested-shell/sub-tabs per
   the catalog above) gets adapted per established precedent without necessarily asking.
5. **Ask (via a scoped question, not a vague "does this look right?") only for genuine judgment
   calls or real blockers** — dropping a load-bearing feature (CSV export), scope decisions with
   no existing precedent (build a marketplace-only tab anyway?), or an architecture gap with no
   safe default (the tenant-ID lookup). Don't ask about things already covered by an established
   pattern in this doc.
6. **Write the implementation plan** (context: what's being ported and why, what's excluded and
   why, the API domain's endpoints confirmed against the literal Vite source, the UI file
   breakdown) and get it approved before writing code.
7. **Build, then verify** per the section above.
