# In-app host: running AppSketch-built apps inside AppSketch

AppSketch can open another AppSketch-built Expo app and run it natively on the
phone, the way Expo Go opens a project. Scan the QR code in a Coder workspace
(or paste its `exp://` link), and the app starts full screen, with a small **AS**
bubble on top for **Reload** and **Back to AppSketch**.

## How to use it

- **Market tab → QR button** (top right of the header) opens `/scan`.
- **Coder workspace → Preview tab** (`MobileExpoPreview`) opens the app full
  screen as soon as the tab gains focus; **Open app** reopens it. The small
  QR icon in the corner opens a share sheet: the QR, **Share** (system sheet:
  WhatsApp, Instagram, …) and **Copy link**. The shared link is the
  workspace's `https://appsketch.ai/preview/<uuid>/`: a browser shows the web
  preview, AppSketch's scanner runs it natively. Builds without the native
  module (web, older binaries) fall back to Expo Go.
- From code: `useOpenGuestApp().open(link)` in `src/lib/guest-app.ts`.

Accepted links:

| Link | Meaning |
| --- | --- |
| `https://appsketch.ai/preview/<uuid>/` | Live workspace through the site's https proxy (preferred) |
| `exp://host:port` | Live Metro dev server of a Coder workspace (tunnel port) |
| `exps://…/manifest.json`, `https://…/manifest.json` | Published native bundle (see below) |
| `<scheme>://open?url=<encoded exp link>` | Deep link that wraps one of the above |

`expo_go_*` sign-in parameters from Coder QR codes are dropped.

## How it works

The native module lives in `modules/appsketch-host` (local Expo module,
autolinked).

- **One runtime per guest.**
  - iOS: a second `ExpoReactNativeFactory` (`GuestSession.swift`), shown in
    `GuestViewController`.
  - Android: a second `ReactHostImpl` (`GuestSession.kt`), shown in
    `GuestActivity`.
  - Both are built from AppSketch's own native modules. So a guest can only use
    native modules that AppSketch ships, at AppSketch's versions.
- **SDK must match.** The host is Expo SDK **57** (RN 0.86, Reanimated 4.5).
  `resolveGuestApp` refuses other SDKs with a clear error (`sdk-mismatch`).
  When the generator moves to a new SDK, AppSketch must move with it.
- **Native modules must be shipped.** A guest that imports a native module
  AppSketch lacks dies at start (e.g. "AsyncStorage is null"). The builder
  agent adds packages beyond the starter's. On 2026-10-21, across all 47
  published mobile templates, that meant:

  | Package | Templates using it |
  | --- | --- |
  | `lottie-react-native` | 47 |
  | `expo-image-manipulator` | 45 |
  | `react-native-webview` | 45 |
  | `expo-location` | 44 |
  | `@react-native-async-storage/async-storage` | 26 |
  | `expo-device`, `expo-notifications` | 25 |
  | `expo-video` | 20 |
  | `expo-clipboard` | 6 |
  | `expo-camera`, `expo-sharing`, `react-native-view-shot` | 1 |

  All of them are now dependencies here. Before each release, re-run the scan
  (union of `dependencies` in every published Expo workspace's
  `package.json`) and `npx expo install` anything new. Fonts and pure-JS
  packages need nothing. `react-native-webview` stays at the SDK's 13.x,
  which is what Expo Go runs these apps on, even where a template asks for
  14.
- **Live workspaces go over https.** The tunnel (`http://tunnel.appsketch.ai:81xx`)
  is plain http on a high port, which many Wi-Fi and mobile networks block:
  on a real phone that was "Couldn't reach the app" or a black screen while
  the 9 MB bundle stalled. The same Metro answers at
  `https://appsketch.ai/preview/<uuid>/` on 443, so the builder uses that.
  The manifest still names the tunnel in `launchAsset`; `resolve.ts` rebases
  the bundle URL onto the preview path (assets follow, they already carry
  the `/preview/<uuid>` base). A sleeping workspace answers with its HTML
  boot page; the resolver keeps asking for up to 2 minutes.
- **Loading screen.** The guest shows "Starting <app>…" until its first frame
  (iOS: `RCTContentDidAppearNotification` from inside the guest's root view;
  Android: the first child of its `ReactRootView`).
- **Live workspaces.** The Metro manifest is fetched with
  `expo-platform: ios|android`. The launch bundle URL is then rewritten to
  `dev=false&hot=false&minify=true` (no `lazy`): a release host has no dev
  client or HMR, so **Reload** in the bubble is how you pick up edits.
- **Assets** load from the guest's server, because the bundle's source URL is
  its http URL.
- **`Constants.expoConfig` is the guest's.** A fake `ExpoUpdates` module
  (`GuestUpdatesModule`) hands the guest runtime its own manifest. This lets
  generated code read `extra.tenantId` and friends. The main AppSketch runtime
  still sees the embedded config.
- **Deep links.** expo-linking keeps the last URL AppSketch was opened with in
  a process-wide registry. The host clears it before a guest starts, so
  expo-router in the guest doesn't route to AppSketch's own path (e.g.
  `/scan`).
- **Crashes.**
  - iOS: a JS fatal in a release build would kill AppSketch, so while a guest
    runs, the fatal handlers show the guest's error screen instead (**Try
    again** / **Back to AppSketch**).
  - Android: instance exceptions go to the same panel.
- **Cleartext.** Workspaces are served over plain http from `*.appsketch.ai`.
  ATS and Android network security config allow that domain only
  (`plugins/with-guest-network.js`).

### Published templates

`resolveGuestApp` reads the backend's native-export manifest
(backend `docs/NATIVE_BUNDLES.md`, branch `feat/native-bundles`):

```json
{ "sdkVersion": "57.0.0", "bundles": { "ios": "<cdn>/ios/index.js", "android": "<cdn>/android/index.js" },
  "expoConfig": { … }, "codeVersion": "…" }
```

It is served at `/api/builder/coder/native/<uuid>/manifest.json`, and the
templates API returns that URL as `native_manifest_url`. Until that backend is
deployed and backfilled, Preview on a mobile template says
"This app can't run on the phone yet" (404).

## Market tab = the `/templates` gallery

`MarketplaceScreen` shows what appsketch.ai/templates shows, from the same two
public endpoints (`useMarketTemplates` in `src/api/templates`):

- `builder/coder/templates/`: published apps. That covers mobile apps,
  websites and ecosystems. They come first, paged by `limit`/`offset`, and
  filter by category **name** and `app_type` / `ecosystem`.
- `builder/layouts/browse-portfolios/`: the legacy layout sites. They follow
  the code templates, and filter by category **id**.

The type row (All / Apps / Websites / Ecosystems) is the web gallery's switch.
Apps and Ecosystems hide the layout sites.

On a code template card:

- **Preview** opens the live site in `/app-preview?url=` (web). For a mobile
  app, it runs the app natively in the host.
- **Use app** works as on the web. It runs
  `POST builder/coder/clone/ {tenant_id}`, which copies files, data and chat,
  and for an ecosystem every app in the group. It then opens the builder on
  the copy at `/code-editor/preview` with the app's `tenantId`, `tenantUid`
  and `appType`. Signed out goes to `/login`.

  A fresh copy has no dev server running, and the runner only starts one
  (Metro and its `exp://` tunnel) when the app's `/preview/<uuid>/` page is
  requested. The web builder's preview frame does that by loading.
  `useExpoUrlPoll` does it on purpose: it requests that page until a URL
  appears, then pings `__keepalive` every 30s, because the runner stops a
  server that has gone ~90s without a new request. Without this, the mobile
  preview polled `expo-url` forever on every copied template.

Layout sites keep their old Preview (it creates a tenant from the layout and
shows its live store).

### Looks like the web gallery

The tab is drawn like appsketch.ai/templates (`src/containers/Marketplace/gallery/`):

- **Colours.** `theme.ts` copies the web page's variables. White (pale grey
  page, white cards with an orange/blue glow) is used in light mode, the web's
  black theme in dark mode. Orange is the action colour: Use app, the active
  chip, the active type pill.
- **Masonry.** `masonry.ts` uses the web's three shapes:
  - a phone app is a tall cell (a titanium phone on a lit stage);
  - a website is one cell (its screenshot at 16:10);
  - every 5th published website is a full-width feature.

  A tall card is exactly two rows plus a gap, so the columns stay level. A
  feature waits until they are (the web's `dense` flow, by hand).
- **Badges and chips.** `tags.ts` is a port of the web's `templateTags.ts`
  (coloured chips, the red Featured tag). Change both together.
- **Buttons.** Touch has no hover, so the web's hover buttons sit under each
  card, always visible: Preview / Live preview / Try app, and Use app / Use
  ecosystem.

## Native projects are generated (CNG)

`ios/` and `android/` come from `expo prebuild --clean` (`APP_ENV=production`).
Don't hand-edit them. Customisations live in config:

| What | Where |
| --- | --- |
| Release keystore + gradle signing | `plugins/with-release-signing.js`, `credentials/android/` |
| Firebase config files | `credentials/firebase/` (referenced from `app.config.ts`) |
| `GoogleUtilities` modular headers (Podfile) | `plugins/with-firebase-modular-headers.js` |
| http to `*.appsketch.ai` | `plugins/with-guest-network.js` |
| iOS privacy manifest | `ios.privacyManifests` in `app.config.ts` |
| FCM default notification colour | `plugins/with-fcm-notification-color.js` (`tools:replace`, so the manifest merge succeeds) |

The iOS project is now `AppSketch` (was `Zorviaa`); `fastlane/Fastfile` points
at it.

## Store notes

- **Google Play** allows downloading and running interpreted JS, so the host is
  fine there. Don't add `REQUEST_INSTALL_PACKAGES` (installing APKs) without a
  policy review.
- **Apple** (2.5.2 / 4.7) allows running code the user builds themselves
  (developer-tool style), not a storefront of third-party apps. Keep the host
  framed as "test the app you're building". Gallery templates opened in the
  host must stay previews.

## Known gaps

- No HMR or fast refresh for live workspaces (manual Reload).
- One guest at a time; opening another replaces it.
- A host deep link that arrives while a guest is open also reaches the guest's
  expo-linking listeners.
- AppSketch's scheme `appsketch-ecommerce` is also claimed by generated apps.
  On a device that has both, iOS asks which app to open. Prefer the bundle-id
  scheme (`com.appsketch-ai.app://`) for links meant for AppSketch.
