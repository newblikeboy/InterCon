# Billing review — 21 September 2026

Updated package prices: monthly INR 1,500, quarterly INR 4,000, yearly INR 10,000. The homepage, structured metadata, portal catalogue, and new checkout orders agree. Checkout and payment records use paise; account billing amounts use rupees.

## Fixed in this change

- A paid plan with no expiry previously granted unlimited access. Both server and portal now require a valid future expiry. Existing records missing an expiry need their paid-through date restored from verified payment evidence; this change does not rewrite customer records. The separate free allowance still applies where available.
- Suspended or deleted workspaces could create payment orders. Checkout now rejects these workspaces before creating an order or contacting the provider. Payments already made can still be recorded without removing the workspace suspension.
- The portal displayed the current catalogue price as the price of an existing subscription. It now displays the recorded purchase amount while the renewal cards show current prices. Orders created before the price change retain their saved amount.

## Verification

- `npm test`: 99 passed, zero failures.
- `npm run check`: 110 JavaScript files passed syntax checks.
- `npm run check:ui`: 27 browser checks passed.
- Billing coverage includes all three checkout amounts and durations, invalid signatures, cross-workspace verification, amount/currency/order mismatches, failed/refunded payment rejection, concurrent duplicate callbacks, transaction rollback and retry, old-price orders, webhook recovery, worker reconciliation, expiry, and preserving paid access during checkout.
- Browser checks verify historical purchase pricing, the new renewal price, and missing-expiry behavior.

Provider responses were simulated and integration tests used a temporary MongoDB replica set. No live charges or production data changes were performed.

## Remaining gaps and operational limits

1. **Refunds and disputes need manual handling.** `handlePaymentWebhook` processes only `payment.captured` and `order.paid`. A refund or dispute after activation does not automatically update payment history or adjust access. An entitlement policy for partial/full refunds and chargebacks is needed before implementing that automation.
2. **Abandoned checkouts accumulate.** `reconcilePendingOrders` examines 25 pending orders per pass, and pending orders have no terminal abandonment state. A large backlog increases recovery delay. Orders left in `creating` after a provider or database failure are not reconciled by this worker.
3. **Renewals are manual purchases.** The implementation creates one-time payment orders and adds the purchased months to the existing paid-through date. It does not create recurring subscriptions or auto-debit customers.
4. **Production recovery remains unverified.** Confirm the billing worker is running, the Razorpay webhook is configured, and MongoDB supports transactions. Repository tests do not establish the state of the deployed services or prove a live checkout succeeds.

The manual `billing:activate` CLI also remains an administrative override: it grants access without recording a provider payment. It is not exposed as a customer HTTP endpoint.
