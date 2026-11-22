# Copy-ready store values for the AppSketch plans

The app and the backend find products by **Product ID** (Apple) / **Product ID
+ Base plan ID** (Google). Those must be typed exactly as below; every other
field is free text. Prices are the live plans API's (`account/subscription-plans/`).

## App Store Connect

Subscription group: `appsketch-pricing-subscriptions` (any name works).
Group localization (English): Display Name `AppSketch Plans`.

| Level | Reference Name | Product ID | Duration | Price (India) | Display Name | Description |
|---|---|---|---|---|---|---|
| 1 | 100X Yearly | `ai.appsketch.plan.100x.yearly` | 1 Year | ₹1,99,999 (nearest point) | 100X Yearly | Scale fast: 30M credits/mo, top AI models |
| 1 | 100X Monthly | `ai.appsketch.plan.100x.monthly` | 1 Month | ₹19,999 | 100X Monthly | Scale fast: 30M credits/mo, top AI models |
| 2 | Growth Yearly | `ai.appsketch.plan.growth.yearly` | 1 Year | ₹49,999 | Growth Yearly | For small teams: 6M build credits a month |
| 2 | Growth Monthly | `ai.appsketch.plan.growth.monthly` | 1 Month | ₹4,999 | Growth Monthly | For small teams: 6M build credits a month |
| 3 | Basic Yearly | `ai.appsketch.plan.basic.yearly` | 1 Year | ₹14,999 | Basic Yearly | Solo builders: 1M build credits a month |
| 3 | Basic Monthly | `ai.appsketch.plan.basic.monthly` | 1 Month | ₹1,499 | Basic Monthly | Solo builders: 1M build credits a month |

- Level 1 = highest. Monthly and yearly of the same plan share a level (a
  switch between them is a crossgrade).
- Display Name ≤ 30 characters, Description ≤ 45: the values above fit.
- Product IDs can never be changed or reused. If an existing subscription
  (e.g. "Basic Monthly") was created with any other Product ID, delete it
  while it is still "Prepare for Submission" and create it again.
- Each subscription also needs: Availability (all countries, or India), a
  Review screenshot (the app's Pricing tab), and Review notes, e.g.
  `Plans are sold only through In-App Purchase. Demo account: <email> / <OTP or password>.`
- If a price is above Apple's highest price point for INR, pick the highest
  allowed. The app shows Apple's own price, so nothing needs to change.
- App → App Information → App Store Server Notifications, Production and
  Sandbox: `https://appsketch.ai/api/account/payment/webhook/apple/`, Version 2.
- Submit: the first subscriptions go to review with an app version (Distribution
  → the version → "In-App Purchases and Subscriptions" → add all 6).

## Google Play Console

Monetize with Play → Products → Subscriptions → Create subscription (3 times):

| Product ID | Name | Base plan ID | Type | Billing period | Price (India) |
|---|---|---|---|---|---|
| `ai.appsketch.plan.basic` | Basic | `monthly` | Auto-renewing | Monthly | ₹1,499 |
| | | `yearly` | Auto-renewing | Yearly | ₹14,999 |
| `ai.appsketch.plan.growth` | Growth | `monthly` | Auto-renewing | Monthly | ₹4,999 |
| | | `yearly` | Auto-renewing | Yearly | ₹49,999 |
| `ai.appsketch.plan.100x` | 100X | `monthly` | Auto-renewing | Monthly | ₹19,999 |
| | | `yearly` | Auto-renewing | Yearly | ₹1,99,999 (or highest allowed) |

- Benefits (shown on Play): Basic `1M build credits a month`, `1 app + website`;
  Growth `6M build credits a month`, `2 apps + website`; 100X `30M build credits a month`, `4 apps + website`.
- Grace period 7 days, account hold on (defaults are fine).
- Activate each base plan (a base plan in Draft is invisible to the app).
- No offers are needed. If you add a free trial offer later, the app keeps
  showing and charging the base plan's renewing price.
- Play only lets you create subscriptions after an AAB containing billing
  (build 71+) has been uploaded to a testing track.

## What makes it "just work"

| | iOS | Android |
|---|---|---|
| App asks the store for | the 6 Product IDs (+ any new tier from the plans API) | the 3 Product IDs, then reads the `monthly`/`yearly` base plans |
| Purchase sends to backend | `account/payment/apple/verify/` (live) | `account/payment/google/verify/` (needs backend PR feat/google-play-billing deployed) |
| Server setting | none | `GOOGLE_PLAY_SERVICE_ACCOUNT` (+ optional `GOOGLE_PLAY_RTDN_TOKEN`) |
| Renewals/refunds | App Store Server Notifications URL above | Pub/Sub push to `https://appsketch.ai/api/account/payment/webhook/google/?token=<RTDN token>` |
| Test with | TestFlight build 72 (sandbox, free) | Internal testing + License testers (build 72 AAB) |
