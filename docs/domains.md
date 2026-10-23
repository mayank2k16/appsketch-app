# Services cart and domains

Buy team-built apps, extras and a domain in the app, or connect a domain you
already own, and have any of your apps live on it with HTTPS in minutes.
Backend contract: `account/app-cart/*` and `account/app-domains/*`
(backend branch `feat/app-domains`).

## Payment rule

- **Platform plans** (Basic / Growth / 100X) are App Store subscriptions
  (`src/lib/iap`, `docs/pricing-and-apple.md`). They are never in the cart,
  never sold through Razorpay, and nothing links to a web checkout for them.
- **Team builds, extras and domains** are real-world services, paid with
  Razorpay (card / UPI) through `/cart` via the existing
  `openPaymentGateway` (`src/lib/payments/payment-gateway.tsx`).
  `PaymentContext` gained optional `prefillName` and `description`.

## Code map

| Area | Files |
| --- | --- |
| API | `src/api/app-cart/` (catalogue, checkout, confirm, order), `src/api/app-domains/` (search, list, detail, connect, attach, retry, disconnect, `apiError`). Both clients reject a body without the expected shape: appsketch.ai answers unknown `/api` paths with its HTML shell and a 200. |
| Cart state | `src/lib/store/app-cart-store.ts`: zustand persisted in MMKV (`app_cart_v1`): `addonIds`, `domain {name, years, price_inr, tenant_id, options}`, and the registrant `contact` (kept for next time). |
| Shared UI | `src/components/services/`: palette (white tokens + dark), `inr()` (UI-thread safe), `AnimatedTotal`, `ScreenHeader`, `StateNote`, `AppPicker` / `AppSheet` (my apps, Website / Mobile app). |
| Pricing | `src/containers/Pricing/planner/*`, `domain-card.tsx`, `domain-result.tsx`, `custom-card.tsx`, `cart-button.tsx`. |
| Cart | `src/app/cart.tsx` → `src/containers/AppCart/`. |
| Domains | `src/app/domains/{_layout,index,connect,[id]}.tsx` → `src/containers/Domains/`. My apps → Settings → Domains renders the same `DomainsList`; Profile has a Domains row. |

## Cart flow (`/cart`)

1. Lines: builds and extras (from the live catalogue, each removable; the
   last build removed drops the extras) and the domain line (years chips,
   "Use it for" app sheet, optional).
2. With a build: "Builds run on a platform plan — choose it in Pricing" and
   the user's current plan.
3. With a domain: the 9 registrant fields (Namecheap; Country = 2-letter
   code), prefilled from the account (name, email, phone) and `IN`.
4. **Pay ₹X**: signed out → `/welcome?return=1`. Otherwise
   `POST app-cart/checkout/` → the `razorpay` block is mapped to a
   `CheckoutV2Response` → Razorpay → `POST app-cart/confirm/`.
   Cancel is silent; failures show the server's `error`. If confirm fails
   after a successful payment, the order screen still opens and keeps
   checking.
5. The order view polls `GET app-cart/orders/<id>/` every 3s until
   `fulfilled` or `failed`; a bought domain offers **Set up domain →**
   (`/domains/<domain_id>`). The cart is cleared once paid.

## A domain comes with a plan + discount codes

Server rules (backend `feat/app-domains`, `account/discounts/*`):

- **A domain is sold only with a platform plan.** Whenever the cart has a
  domain (code or not) and the user has no active paid plan, checkout
  answers 400 `{"error", "code": "plan_required"}`. Paid = Spark / Basic /
  Growth / 100X / Assistive / Enterprise, not expired, any source (Apple IAP
  writes the same row); the free trial does not count.
- **Discount codes** are created by the owner in Django admin or
  `python manage.py create_discount_code DOMAIN50 --percent 50 --max-inr 500 --applies-to domain`.
  Domain discount = min(round(price × percent), cap), never above the domain
  price, the same with a monthly or yearly plan. One code per order; the
  redemption is recorded only once payment is verified.

In the app (plans stay App Store only; the domain stays Razorpay):

1. **Plan step** (`AppCart/plan-step.tsx`): with a domain in the cart and no
   active paid plan (`hasPaidPlan` in `use-cart-totals.ts`), a "Your domain
   comes with a plan" card sits under the order: Monthly / Yearly, the paid
   tiers smallest first (Basic preselected; prices from StoreKit via
   `usePricing`, like the Pricing tab) and **Subscribe with Apple** →
   `buyPlan(tier, cycle)`. Signed out → `/welcome?return=1`; Android → the
   web pricing page; no StoreKit products → "Plans aren't available right
   now · Try again". Once the purchase verifies, `user.subscription` turns
   active and the card collapses to "✓ Basic · Yearly — active". Until then
   **Pay is disabled** and the pay bar says "Add a plan above to pay". Users
   who already have a plan never see the card. A checkout 400
   `plan_required` sets `planRequired` in the cart store (not persisted),
   which forces the card even if the local subscription looked active; the
   next activation clears it.
2. **Discount code** (`AppCart/discount-row.tsx`): "Have a discount code?" →
   input + Apply → `POST account/discounts/validate/` with
   `{code, domain_price_inr, has_plan_in_order: true}` (true because Pay is
   gated on the plan). Valid → green removable chip "DOMAIN50 · −₹450 on your
   domain" plus Subtotal / green "DOMAIN50 · 50% off domain −₹450" / Total
   rows, and the pay bar reads "Total · you save ₹450". Invalid → the
   server's `message` under the chip (`reason` is in the body too); network
   failure → "Couldn't check this code · Retry". It re-validates whenever the
   domain or its years change (react-query key = code + price). The code is
   kept in the persisted cart (`discountCode`, uppercased) and cleared with
   the cart after payment.
3. **Checkout** sends `discount_code` only when validation said valid.
   Razorpay always charges the server's `total_inr` (its `lines` carry the
   negative discount line, `discount: {code, amount_inr}`); if it differs
   from the screen a toast says "Your total is ₹X" first. A 400 with a code
   reason (expired, used_up, already_used…) re-validates so the chip shows
   why. Order lines render negatives green with a minus sign (`signedInr`).

Pricing tab: the domain card shows "Comes with any plan · DOMAIN codes
accepted".

API: `src/api/app-cart/discount.ts` (`validateDiscount`,
`useDiscountValidation`, `DISCOUNT_KEY`), `PLAN_REQUIRED` and
`OrderDiscount` in `types.ts`, `apiErrorCode` in `src/api/app-domains/errors.ts`.
Not to be confused with `src/api/discounts` (the CMS's store discounts).

## Domain stages

`awaiting_dns` → `building` → `securing` → `live`, plus `failed` and
`web_unavailable` (the app is a mobile app with no web build; the server's
`detail` explains it, and the domain can be attached to a website instead).

`/domains/[id]` shows a 4-step tracker (DNS connected → Building your site →
Securing with HTTPS → Live) and polls `GET app-domains/<id>/` every 5s until
`live` / `failed`, only while the screen is focused and the app is in the
foreground (`usePageActive`). Pull to refresh works any time.

- **DNS card**: "Use our nameservers" / "Keep your DNS (A records)" with
  tap-to-copy values (expo-clipboard) and "Checking every few seconds"
  until verified. Bought domains say DNS is already set.
- **Certificate card**: status, issuer, expiry, auto-renew.
- **Opens**: the attached app with "Change app" (`POST attach`).
- **Actions**: Open site (live), Retry setup (failed, `POST retry`),
  Disconnect (connected domains only, confirm alert, `DELETE`).

`/domains/connect`: pick one of my apps (a mobile app shows an honest note),
enter the domain, `POST app-domains/connect/` → replace to the detail.

## Verified / not verified

Verified in the iOS Simulator against mocked catalogue / search / detail
responses (the backend was not deployed yet): planner picks, extras unlock,
step 3 pop, summary bar and sticky bar, counting total, plans section,
domain search rows, custom card, cart lines and auto-removal, domain line,
registrant form, guest states of /domains and /domains/connect, detail
screen. Not run: a real checkout, Razorpay, confirm, order polling,
connect / attach / retry / disconnect against the server, signed-in lists.

Discount + plan step (round 2): verified in the iOS Simulator with temporary
mocks (StoreKit products, validate response, an activated subscription;
reverted before commit): plan step monthly / yearly, tier pick, Pay locked
with the hint, invalid-code message, DOMAIN50 chip + totals capped at ₹500,
re-validation on a years change, collapse to "✓ Basic · Yearly — active"
unlocking Pay, the Pricing hint. Unmocked it shows the honest states (the
validate endpoint was not deployed; no StoreKit products in the simulator).
Not run: a real Apple purchase, real validate / checkout with a code,
`plan_required` from the server, Razorpay.
