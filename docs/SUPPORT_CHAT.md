# Support Chat (AppSketch builder app)

Realtime chat with support agents. Backend reference:
`appsketch_backend/docs/SUPPORT_CHAT.md`.

## The account-type wrinkle

Sibling customer apps (Chinese Corner, Freshee Fresh, …) authenticate their
users as `account.Profile` — the `support` backend's `SupportConversation`
was originally built around that.

**This app's users are `account.TenantUser`, not Profile** — the OTP login
flow here hits `account/tenant_user/verify-tenant/`, the same auth used by
CMS/builder accounts. Porting the Profile-based client code as-is caused
`POST /api/support/conversations/` to raise a foreign-key violation (500):
the view was writing a TenantUser id into a FK that only accepted a Profile id.

The fix lives entirely in the backend (`appsketch_backend/support/`): parallel
nullable `customer_tenant_user` / `sender_tenant_user` / `closed_by_tenant_user`
FKs alongside the existing Profile ones, and every place that resolved
"customer" now branches on account type. See the backend doc's **Two customer
account types** section for the full breakdown. Nothing in this app's own
client code needs to know about this — `startConversation()` etc. call the
same `/api/support/...` endpoints the same way; the server resolves the right
FK from the JWT's account type.

One consequence worth knowing: the room socket used to treat *any*
`TenantUser` as a support agent. That was fixed to check `role in
(ADMIN, SK)` only (matching the REST side) — otherwise every builder-app user
opening their own support chat would've been treated as staff.

A second, subtler one: **every builder-app user is `role=ADMIN` of their own
store** (same account used elsewhere in this app to manage Products/Payments/
etc.), so a naive "is this user an admin?" check on `POST conversations/`
rejected them as staff even though they're clearly not AppSketch's own
support team — symptom: `Could not open support chat` /
`"Agents reply to existing conversations."` for every signed-in user. Fixed
backend-side (`_target_tenant_id`, see the backend doc) by checking "is this
user staff **of the tenant this conversation is actually for**" (AppSketch's
own internal tenant, resolved from the URL, not the caller's own store)
rather than "does this user have an ADMIN role anywhere."

A third one, once conversation creation itself started working: fetching that
conversation's messages 403'd, and the room socket got stuck on
"Connecting…". Same root cause reaching further — `_accessible()` (REST) and
`_authorized()` (socket) both checked "is staff" *before* "does this user own
the conversation", so the same ADMIN-of-their-own-store role routed a builder
into the staff branch even for their own conversation, which then (correctly,
by its own logic) rejected them since their store's tenant ≠ the
conversation's tenant. Fixed by checking ownership first everywhere — see the
backend doc's "**Ownership is checked before role, everywhere else too**".

A fourth round fixed the app's conversation list and the CMS inbox both
showing **empty** for a thread that plainly existed (opened fine by id), and
a builder's own photo/file uploads (media goes over REST, unlike text over
the socket) rendering on the *agent's* side of their own chat. Same root
cause each time — "is staff" and "is admin" were still being asked as
per-**user** questions instead of per-**conversation** ones. See the backend
doc's "**Side is a per-conversation fact, not a per-user one**",
"**Listing is a union, not an either/or**", and "**Backward compatibility**"
(confirms none of this changes behaviour for the sibling storefront apps or
a plain CMS agent — audited function by function).

## Entry points
- **Drawer** → "Help & Support" (`src/components/drawer-menu.tsx`, Quick
  Access section, signed-in only) → `/support` (the list)
- **Profile** → "Help & Support" row (`src/containers/Profile/ProfileScreen.tsx`)
  → `/support`

## Screens
Modeled on the sibling storefront apps' list-first flow (`freshee-fresh`'s
`support.tsx`), minus the order picker — this app has no orders/storefront, so
"New Conversation" always starts a plain general thread, no scoping choice to
make:
- `src/app/support.tsx` + `src/containers/Support/SupportListScreen.tsx` —
  the customer's own conversations (`useConversations()`), each row showing
  subject/preview/unread badge/last-active time, tapping one opens it
  (`/support-chat?id=<id>`). A "New Conversation" FAB calls
  `useStartConversation()` and navigates straight into the new thread.
- `src/app/support-chat.tsx` + `src/containers/Support/SupportChatScreen.tsx`
  — the live room, opened either with an `id` param (reopening an existing
  thread from the list) or none (a direct entry point that get-or-creates the
  general thread). Message bubbles, the agent's presence in the header
  (online / typing / idle / offline / closed), read ticks, photo/video
  upload, and an "End chat" action. Adapted from this app's own CMS
  `Support/ChatView.tsx` (agent side), mirrored for the customer side
  (`sender_type: 'CUSTOMER'`, tracks agent presence instead of customer
  presence).
- `src/containers/Support/MessageBubble.tsx` — customer-side bubble (`mine`
  = `sender_type === 'CUSTOMER'`), using this app's own theme (`AppColors`)
  rather than the CMS theme. `FILE` messages render as a labelled card with an
  extension-derived icon (PDF / spreadsheet / doc / slides / archive).

### Composer
- **Attachments** open a source sheet: **Camera** (`launchCameraAsync`),
  **Photos & Videos** (`launchImageLibraryAsync` with
  `allowsMultipleSelection`, up to 10), and **Document**
  (`expo-document-picker`, `type: '*/*'`, `multiple`) for PDFs, Word, Excel,
  etc. Each picked file becomes its own message via a shared `uploadOne()`
  (optimistic bubble → REST multipart → socket echo dedupes on `client_id`).
  Uploads run **sequentially**, not `Promise.all` — ten concurrent multiparts
  on mobile data reliably time some out, and the server orders by arrival.
- **Voice** is dictation into the text box via the app's existing
  `useVoiceInput` hook (`@react-native-voice/voice`), same as the Agent and
  Home composers — not audio-message recording.
- The box sits `insets.bottom + 14` off the bottom edge and is ~10% taller
  (`minHeight: 44`, `maxHeight: 110`).

> ⚠️ `expo-document-picker` is a **new native dependency**. `pnpm install`
> then rebuild the dev client (`pnpm prebuild` + `pnpm ios`/`android`) — a
> JS-only reload throws `Cannot find native module 'ExpoDocumentPicker'`.
>
> Its own import used to sit as a bare `import * as DocumentPicker from
> 'expo-document-picker'` at the top of `SupportChatScreen.tsx`. Expo modules
> resolve their native binding at import time (most call
> `requireNativeModule()` immediately), so on any build shipped **before**
> this dependency was added and never rebuilt, just navigating to the screen
> crashed — before the user ever touched the attach button. Fixed by
> `src/lib/safe-document-picker.ts`: a `require()` wrapped in try/catch,
> called lazily from inside `pickDocuments()` (only reached by tapping
> "Document" in the attach sheet) instead of imported at module scope. On an
> unrebuilt binary it now degrades to a toast ("Document attachments
> unavailable — try Camera or Photos & Videos instead") rather than crashing;
> once the app is rebuilt with the native module linked, it works normally.
> `expo-image-picker` and `@react-native-voice/voice` didn't need the same
> treatment — both were already linked and working elsewhere in the app
> (CMS `Support`/`ShortVideos`, Home `AgentV2`) before this feature.

## API layer (`src/api/support/`)
- `client.ts` — REST calls + `supportRoomSocketUrl()`/`supportInboxSocketUrl()`.
  `startConversation(subject?)` always creates a **general** conversation (no
  `order_id` — this app has none). `getTenantHint()` falls back to
  `SUPPORT_TENANT_ID = 1` (this app's own platform tenant) rather than an
  empty string, since a customer `Profile` in the sibling apps carries its own
  `tenant_id` but our `TenantUser` accounts don't expose one the same way.
- `use-support.ts` — `useConversations()` / `useStartConversation()` (React
  Query), used by the list screen. Added alongside the existing CMS-oriented
  `client.ts`/`types.ts` (see below) — the CMS `Support` container manages its
  own state directly rather than through React Query, so this is customer-side
  only.
- `types.ts` — shared types. This file (and most of `client.ts`) was
  originally ported for this app's own CMS `Support` container (the agent
  side, `src/containers/CMS/Support/`) — the customer-facing pieces
  (`startConversation`, `fetchUnreadCount`, `subject`/`customer_unread` on
  `Conversation`) were added alongside it, reusing the same REST surface.

## Realtime model
Same as the backend doc describes: text over the socket (idempotent on
`client_id`, REST fallback if the socket is down); photos/videos via REST
multipart, arriving back over the socket; presence reported automatically
(`online` on connect, `typing` while typing, `left` on disconnect).

## Push notifications
`services.maybe_push_customer` (backend) already fires for either account
type — it reads `conversation.customer_account` (whichever of
`customer`/`customer_tenant_user` is set) and both have their own
`device_id`, captured at login (`verify_tenant_user` saves it on `TenantUser`
the same way `Profile` login does).

What this app was missing was entirely **client-side tap handling**. The push
payload is `{route: "support-chat", conversation_id}`, and
`src/lib/notifications/setup.ts` had two gaps:

1. No `route === 'support-chat'` case at all — it only handled CMS tab routes
   (`orders`/`notifications` → `/cms`). Added, deep-linking to
   `/support-chat?id=<conversation_id>` via a shared
   `routeFromNotificationData()`.
2. **No Firebase open-handlers.** Only expo-notifications' response listener
   was registered, which on Android never fires for the tray notification
   **FCM itself** posts while the app is backgrounded or killed — so a tap
   just opened the app on its last screen. Added
   `messaging().onNotificationOpenedApp()` (backgrounded) and
   `messaging().getInitialNotification()` (killed), both routing through the
   same helper.

A cold-start tap also runs before the navigator mounts, where `router.push` is
a silent no-op (or throws "Attempted to navigate before mounting the Root
Layout"), so `navigateWhenReady()` retries on a short interval until the tree
is up.

### Sound: support replies were playing the *orders* sound
This app has exactly one Android notification channel,
`NOTIFICATION_CHANNEL_ID = 'appsketch_staff_orders_v1'` (`setup.ts`) — built
for "New orders" with a bundled `notification.wav` sound. Two places sent
**every** push through it regardless of what it actually was:

1. **Foreground.** `subscribeToForegroundPushes()`'s `onMessage()` handler
   hard-coded `{channelId: NOTIFICATION_CHANNEL_ID}` on the trigger for every
   re-presented notification, support-chat replies included.
2. **Background/killed.** `AndroidManifest.xml`'s
   `com.google.firebase.messaging.default_notification_channel_id` is
   `appsketch_staff_orders_v1` — the channel FCM falls back to when a push's
   `android.notification.channel_id` field is unset. `maybe_push_customer`
   (backend) never set one for this app, so it fell through to that same
   orders channel in every app state, not just foreground.

Fixed with a second channel, `GENERAL_NOTIFICATION_CHANNEL_ID =
'appsketch_general_v1'` (`ensureGeneralAndroidChannel()`), created with no
custom `sound`/`vibrationPattern` — Android's own default notification
sound. `subscribeToForegroundPushes()` now picks the channel from
`data.route` (`route in ROUTE_TO_TAB` ⇒ orders channel, everything else ⇒
general), and `support/services.py`'s `maybe_push_customer` now passes
`channel_id="appsketch_general_v1"` explicitly **only when the customer is a
`TenantUser`** (this app) — a `Profile` customer (chinese-corner,
freshee-fresh) still gets `FcmService`'s own default
(`"freshee_default_v4"`), which is untouched by this fix since those apps
never had this problem — they don't share this app's orders channel/manifest
default in the first place.

> A channel's sound/vibration are locked at creation — if
> `GENERAL_NOTIFICATION_CHANNEL_ID` ever needs different settings, bump the
> version suffix (`_v1` → `_v2`) so upgrading users get a fresh channel
> instead of one stuck with the old settings.

## Delete Account
`src/containers/Profile/ProfileScreen.tsx` — destructive-confirm →
`POST /api/account/tenant-users/delete_account/` (no body; the backend acts on
the authenticated caller) → sign out → `/login`. This is a **different**
endpoint from the Profile-based `account/profile/delete_account/` sibling apps
use (phone-number lookup) — same account-type split as support chat. See the
backend doc's **Account deletion** section.

## Drawer menu redesign
While wiring in "Help & Support", the drawer (`drawer-menu.tsx`) was also
restyled: every row is now a bordered card with a tinted circular icon badge
(`DrawerRow`), replacing the previous flat icon-next-to-label list. This uses
`rowBg`/`rowBorder`/`iconWrapBg` theme tokens (`HomeTheme.ts`) that already
existed but were unused — the drawer used to look this way and had drifted to
a flatter style.
