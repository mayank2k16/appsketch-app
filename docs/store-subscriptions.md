# Plan subscriptions on the App Store and Google Play

What has to be set up in each store console for the AppSketch app
(`com.appsketch-ai.app` on iOS, `com.appsketchai.app` on Android) to sell the
Basic / Growth / 100X plans, and what is already in the code.

## Where things stand (build 71, 2026-11-22)

| | iOS | Android |
|---|---|---|
| Sign-in | Apple + Google + phone/email | Google + phone/email (no Apple) |
| Plans in the app | StoreKit In-App Purchase (`src/lib/iap/`, expo-iap) | "Choose on appsketch.ai" (web checkout) |
| Backend | `account/apple.py` verifies + activates, webhook live | nothing for Play yet |

## App Store (iOS) — code is done; console steps

Product ids (fixed, shared with the backend):
`ai.appsketch.plan.<basic|growth|100x>.<monthly|yearly>` (6 products).

1. **Agreements, Tax and Banking** → the *Paid Applications* agreement must be
   Active (bank account + tax forms filled). Nothing sells until it is.
2. **App → Monetization → Subscriptions**
   - Create one subscription group, e.g. "AppSketch Plans".
   - Add the 6 auto-renewable subscriptions with exactly the ids above:
     duration 1 month / 1 year, a price (pick the INR tier nearest the website
     price; Apple converts other storefronts), a display name, a description,
     and a review screenshot (the Pricing tab).
   - Order the levels **100X (1) > Growth (2) > Basic (3)** so a move up is an
     upgrade.
   - Optional: an introductory offer (free trial) per product.
3. **App Information → App Store Server Notifications**: Version 2, URL
   `https://appsketch.ai/api/account/payment/webhook/apple/` for Production and
   Sandbox.
4. **Identifiers**: App ID `com.appsketch-ai.app` has In-App Purchase and Sign
   in with Apple ticked. Sign in with Apple → Email Sources: register
   `appsketch.ai` so mail reaches private-relay addresses.
5. **Version page**: attach the 6 subscriptions to the version you submit
   ("In-App Purchases and Subscriptions" section) — the first time, they are
   reviewed together with the build.
6. **App Review notes**: a demo account, and "plans are sold only through
   In-App Purchase". Add the Terms of Use (EULA) link to the description and a
   Privacy Policy URL (guideline 3.1.2 requires both for subscriptions).
7. **Test** on TestFlight: purchases there use the sandbox and are free; check
   the plan activates (Profile shows the tier) and Restore works.

## Google Play (Android) — needs code, then console steps

**Policy:** Google Play's Payments policy requires digital goods and
subscriptions sold in an app distributed on Play to use **Google Play
Billing**. Linking out to a web checkout for the plan (today's "Choose on
appsketch.ai") is not allowed and can get an update rejected. In India and
some other regions Play also offers **User Choice Billing / alternative
billing**, where your own checkout (Razorpay) sits *beside* Play Billing for a
lower service fee — it needs enrolment in Play Console and Play Billing still
has to be offered. Real-world services (team builds, domains) are exempt and
can stay on Razorpay.

### Code still to build
1. App: the Pricing tab and the cart's plan step buy through Play Billing on
   Android — expo-iap already supports it (`requestPurchase` with
   `type: 'subs'` and the base plan's `offerToken`), mirroring
   `src/lib/iap/apple-iap.ts`.
2. Backend: `POST account/payment/google/verify/` that checks the
   `purchaseToken` with the Google Play Developer API
   (`purchases.subscriptionsv2.get`), activates the same `TenantUserSubscription`
   as Apple does, and acknowledges the purchase (unacknowledged purchases are
   refunded after 3 days). Plus a Real-time Developer Notifications endpoint
   (Pub/Sub push) for renewals, cancellations and refunds.

### Console steps
1. **Payments profile** (Setup → Payments profile) linked to the developer
   account, merchant details complete.
2. **Monetize → Products → Subscriptions**: create 3 subscriptions
   `ai.appsketch.plan.basic`, `…growth`, `…100x`, each with two **base plans**
   `monthly` (auto-renew, 1 month) and `yearly` (auto-renew, 1 year) and an INR
   price. (Play models monthly/yearly as base plans of one subscription, unlike
   Apple's one product per period.) Activate them.
3. **API access**: in Google Cloud create a service account, enable the
   *Google Play Android Developer API*, then in Play Console → Users and
   permissions invite the service account with "View financial data" and
   "Manage orders and subscriptions". Put its JSON key on the server.
4. **Monetization setup → Real-time developer notifications**: a Pub/Sub topic
   (grant `google-play-developer-notifications@system.gserviceaccount.com`
   Publisher on it) with a push subscription to the backend's RTDN URL.
5. **License testing** (Setup → License testing): add tester Gmail accounts so
   test purchases are free; upload the AAB to the Internal testing track —
   billing only works for a build installed from Play.
6. Optional (India): Monetization setup → **Alternative billing / User choice
   billing** enrolment if you want Razorpay offered next to Play Billing.

## Uploading build 71
- iOS: uploaded to TestFlight with altool (see build/upload71.log).
- Android: `build/AppSketch-71.aab` → Play Console → Testing → Internal
  testing → Create release → upload. `build/AppSketch-71.apk` is for direct
  install/sharing only (Play takes only the AAB). versionCode 71.
