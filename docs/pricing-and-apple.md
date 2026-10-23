# Pricing tab, App Store subscriptions and Sign in with Apple

What changed, why, and what has to be set up outside the code before the
build can sell plans.

## What changed

- **Market tab → Pricing tab.** The bar is Home · Agent · Studio · Pricing
  (`src/components/bottom-tabs/tab-config.ts`, icon `pricing` in
  `TabIcon.tsx`, screen `src/app/(tabs)/pricing.tsx`).
  - The Marketplace is now a pushed stack screen (`src/app/marketplace.tsx`,
    registered in `src/app/_layout.tsx`). Home's "See all" still opens it with
    `router.navigate('/marketplace')`. It now has a back button and only clears
    the home indicator, not a tab bar.
  - The old `/pricing` stack route is gone. `/pricing` resolves to the tab, so
    the drawer's "Pricing & Plans" and `router.navigate('/pricing')` both land
    there.
- **Pricing screen** (`src/containers/Pricing/`). Hero, current plan (with
  Manage on iOS), the Yearly/Monthly toggle, the plan cards and the store
  footer.
  - The toggle puts Yearly first and selects it by default, as on
    appsketch.ai/pricing. The "Save N% with yearly" label is computed as
    yearly vs 12 × monthly from the prices on screen (StoreKit on iOS).
  - Every plan the live `GET account/subscription-plans/` returns that has a
    monthly or yearly price is shown. Tiers are not hardcoded. They are sorted
    in the website's order: free, pro, spark, basic, growth, 100x, assistive,
    enterprise, then any unknown tier by price.
  - Each card shows:
    - the short name ("Basic"),
    - the description,
    - the price: App Store `displayPrice` per year plus "≈ X/month, billed
      yearly" (`product.price / 12` in `product.currency`), or `displayPrice`
      per month,
    - build credits per month (`monthly_token_grant`; 0 means unlimited),
    - AI models (`coder_models`),
    - every enabled feature with "Name: limit" when `integer_limit` is set.
      Up to 8 are shown inline; with more, the first 6 show and a "See all N
      features" link reveals the rest.
  - Growth is "Most popular" and has the one orange CTA.
  - Disabled `plan_features` rows are retired feature codes. The website does
    not list them (for example "Everything in Basic Plan" is disabled on
    Growth), so the app does not either. The formatting lives in
    `plan-format.ts`.
  - The product id for a tier is derived from the tier name, and
    `ensureProducts` asks StoreKit for any tier not prefetched at launch.
    Add-ons are never sold in the iOS app.
- **StoreKit 2 via `expo-iap`** (`src/lib/iap/`). iOS only. Every StoreKit
  call sits behind `Platform.OS === 'ios'`.
- **Sign in with Apple** on `/welcome`, above Continue with Google
  (`src/containers/Welcome/apple-button.tsx`, `useAppleSignIn` in
  `src/hooks/useAuth`).
- **No web checkout on iOS.**
  - `UpgradeSheet` opens the Pricing tab on iOS ("See plans") and keeps the
    browser hand-off on Android.
  - The Domains upgrade copy no longer says "purchased on the web" on iOS.
  - The Razorpay plan checkout is deleted on every platform: the `/cart`
    route, `src/containers/Cart/`, `src/lib/domain-pricing.ts`, and the
    `initiateSubscriptionPayment` / `confirmSubscriptionPayment*` helpers and
    types. The user wants plans bought only through Apple.
    `react-native-razorpay` stays, because generated apps' shop checkout
    (`src/lib/payments`) uses it.
  - The Pricing screen's Android path still opens appsketch.ai/pricing, as
    before.

## Product IDs

Format: `ai.appsketch.plan.<tier lowercased>.<monthly|yearly>`.
`src/lib/iap/product-ids.ts` defines it, and the backend's
`account/payment/apple/config/` must agree.

| Tier   | Monthly                            | Yearly                            | Group level |
| ------ | ---------------------------------- | --------------------------------- | ----------- |
| Basic  | `ai.appsketch.plan.basic.monthly`  | `ai.appsketch.plan.basic.yearly`  | 3           |
| Growth | `ai.appsketch.plan.growth.monthly` | `ai.appsketch.plan.growth.yearly` | 2           |
| 100X   | `ai.appsketch.plan.100x.monthly`   | `ai.appsketch.plan.100x.yearly`   | 1 (highest) |

All six products are in one subscription group ("AppSketch Plans"), so
switching plans is an upgrade, downgrade or crossgrade that StoreKit manages.
A user never holds two plans at once.

## Purchase flow (iOS)

1. `useAppleIapBootstrap()` runs in `src/app/(tabs)/_layout.tsx`. It calls
   `initConnection()`, then `fetchProducts({ skus, type: 'subs' })`, and
   attaches `purchaseUpdatedListener` / `purchaseErrorListener`.
   - About 1.5s after connecting, and again on every sign-in, it sweeps
     `getPendingTransactionsIOS()` (unfinished transactions) through the
     verify step.
2. Subscribe → `buyPlan(tier, interval)`:
   - `GET account/payment/apple/config/` returns `app_account_token`. It is
     cached per user.
   - Then `requestPurchase({ type: 'subs', request: { apple: { sku, appAccountToken } } })`.
3. The listener receives the `Purchase`. `purchase.purchaseToken` is the
   StoreKit 2 **JWS** (expo-iap's "unified purchase token": the iOS JWS,
   Android's purchaseToken). The app sends it as
   `POST account/payment/apple/verify/ { signed_transaction }`.
4. `finishTransaction({ purchase, isConsumable: false })` runs **only** after
   a definitive answer:
   - 200 `success`: the plan is applied with
     `updateSubscription({active, plan:{tier, display_name}})`.
     `useCoderQuota` refetches when the tier changes.
   - 200 `expired`
   - 400 (invalid)
   - 409 (belongs to another AppSketch account)

   Network errors, 5xx, 401/403/404 (for example the endpoint is not deployed
   yet) leave the transaction unfinished, and StoreKit redelivers it. The user
   sees "Your payment went through. We'll finish activating your plan
   automatically…".
5. **Restore Purchases** runs `restorePurchases()` (App Store sync), then
   `getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })`, then
   verifies each AppSketch transaction. It reports the result as activated,
   other account, expired, or nothing found. The button is always shown;
   a guest who taps it is sent to `/welcome?return=1` first, because a
   restored plan has to attach to an AppSketch account.
6. **Manage** calls `deepLinkToSubscriptions({})` and falls back to
   `https://apps.apple.com/account/subscriptions`.
7. Guests or signed-out users who tap Subscribe go to
   `/welcome?return=1`. After they sign in (or tap Skip), they come back to
   the Pricing tab.
8. Ask to Buy (`purchaseState === 'pending'`) shows "Waiting for approval".
   The transaction is verified when it is approved.

Renewals and other background deliveries are verified quietly, with no
toast. Only the purchase the user just started gets success or error
feedback.

If no products load, the screen still shows the plans from the backend. In
that case:
- Prices read "Not available right now".
- Subscribe is disabled.
- A calm "Purchases are not available right now" notice with Retry appears.

The app never falls back to a web link on iOS. This happens when:
- the products are not in App Store Connect yet,
- the agreements or tax setup is not done,
- or the app is running on a simulator without the StoreKit file.

## Backend contract

| Call | Request | Response |
| --- | --- | --- |
| `POST account/auth/apple-tenant-login/` (no auth) | `{ identity_token, full_name: {given_name, family_name} \| null, email \| null }` | Same as google-tenant-login: `{token:{access,refresh}, user, …}` |
| `GET account/payment/apple/config/` (auth) | — | `{ app_account_token: "<uuid>", products: [{product_id, tier, interval, pricing_option_id}] }` |
| `POST account/payment/apple/verify/` (auth) | `{ signed_transaction: "<JWS>" }` | 200 `{success:true, plan:{tier, display_name, interval, start_date, end_date, is_active, days_remaining}, quota}`; 200 `{success:false, expired:true}`; 409 / 400 `{success:false, message}` |

Apple sends the name and email only on the first authorization, so the
backend must keep what it gets the first time.

## Apple guidelines covered

- **3.1.1** Digital plans are sold only through In-App Purchase on iOS.
  - There are no links, buttons or copy pointing to web checkout, and no
    mention of web prices. This covers `UpgradeSheet`, Domains and `/cart`.
  - Prices come from StoreKit (`product.displayPrice`), never the backend's
    INR price.
  - The "Save up to N%" badge is computed from the same StoreKit prices.
- **3.1.2** Auto-renewable subscription disclosures:
  - plan title, localized price and period ("/month", "/year"), and a clear
    Subscribe button,
  - Restore Purchases,
  - the auto-renew text,
  - tappable Terms of Use (Apple's standard EULA,
    https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) and
    Privacy Policy (https://appsketch.ai/privacy-policy),
  - Manage subscription when a plan is active.
- **4.8** Sign in with Apple is offered wherever Google sign-in is offered
  (`/welcome`). `/login`'s AuthForm has no Google button, so it needs none.
  - It uses the system `AppleAuthenticationButton`: BLACK on white, WHITE on
    dark.
  - It matches the Google pill's 54pt height and 27pt radius.
  - It is shown only when `isAvailableAsync()` is true.
  - Cancelling (`ERR_REQUEST_CANCELED`) is silent.
- **5.1.1(v)** Account deletion is already in Profile and is unchanged.

## Native setup (ios/ is committed and hand-edited)

- `app.config.ts`: `ios.usesAppleSignIn: true` and the `'expo-iap'` plugin.
- `ios/AppSketch/AppSketch.entitlements`:
  `com.apple.developer.applesignin = ["Default"]`.
- Pods: `ExpoAppleAuthentication`, `ExpoIap`, `openiap` (run `pod install`).
- `ios/AppSketch/AppSketch.storekit`: a local StoreKit configuration with the
  6 products in one group, storefront IND, ₹1,499/₹14,999, ₹4,999/₹49,999
  and ₹19,999/₹1,99,999.
  - It is referenced from the AppSketch scheme's **Run** (Debug)
    LaunchAction. It only applies when the app is launched from Xcode, not
    from `simctl launch`.
  - Its transactions are signed locally, so the backend's verify call rejects
    them. That is expected. Use Sandbox or TestFlight for end-to-end tests.

## App Store Connect / developer portal checklist

1. Identifiers → `com.appsketch-ai.app`:
   - Enable **Sign in with Apple** (primary App ID) and **In-App Purchase**.
   - Regenerate the App Store provisioning profile, because the manual
     release signing needs the new entitlement.
2. Agreements, Tax and Banking: the Paid Apps agreement must be active.
3. App Store Connect → the app → Subscriptions:
   - Create the group "AppSketch Plans" with the six product IDs above, at
     the levels in the table above.
   - Set prices for India and other storefronts.
   - Add a localized display name and description for each product.
   - Add a review screenshot of the Pricing tab and review notes for each
     product.
4. App Information:
   - Set the Privacy Policy URL.
   - Use the standard EULA, or add custom terms and link to them.
5. App Store Server Notifications V2 URL: point it at the backend, if the lead
   adds that endpoint.
6. The first subscriptions must be submitted **with** an app version
   (attach them on the version page).
7. Sandbox testers: Users and Access → Sandbox. Never use a real Apple ID
   for testing.

## Testing

- Simulator UI: open `ios/AppSketch.xcworkspace` in Xcode and Run the
  AppSketch scheme. The `.storekit` file then serves products, so the Pricing
  tab shows ₹ prices. Debug → StoreKit → Manage Transactions lets you
  inspect or refund transactions.
  - Without Xcode (simctl launch), the tab correctly shows the "not
    available" state.
- End to end: TestFlight or a Sandbox tester on a device.
