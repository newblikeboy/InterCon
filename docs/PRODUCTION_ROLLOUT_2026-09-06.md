# InterCon rollout instructions for the review fixes

This document describes required deployment work. No production database, provider account, email service, or deployed application was changed during local implementation. The [plain-language report](FIXES_PLAIN_LANGUAGE_2026-09-06.md) separates implemented fixes from remaining feature gaps.

## Database and application release

1. Take a database backup and verify the restore procedure in an isolated environment. Use a MongoDB replica set: signup, payment activation, bulk enqueueing, and inbox persistence use transactions.
2. Install the pinned dependency tree with `npm ci`. The new spreadsheet dependency is pinned to SheetJS's official 0.20.3 archive; the browser asset was replaced too. The npm registry package is stale, as described in the [SheetJS installation documentation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).
3. Point `MONGODB_URI` at the intended staging database and run `npm run db:indexes`. This command creates missing schema indexes and verifies unique constraints. Startup performs the same check. It never deletes data or drops existing indexes. If duplicate records or conflicting index options are reported, investigate and migrate them deliberately before continuing. Large existing collections may take time to validate and index; plan the production maintenance window accordingly.
4. Deploy HTTP, message-worker, webhook-worker, and billing-worker code as one release. Avoid running the old message worker after enabling the new UI: the old worker does not enforce all the new delivery checks. Avoid mixed versions during index and transactional-write rollout.
5. Keep the full `src` directory in the deployment, including `src/views/admin-portal.html`. The admin HTML was moved out of `Public` to prevent direct static-file access.

## Processes and settings

Run these under the production process supervisor with restart and health monitoring:

```text
npm start
npm run worker:messages
npm run worker:webhooks
npm run worker:billing
```

Use the existing production requirements in [the hardening runbook](HARDENING_AND_SCALING.md). This release adds:

```text
RAZORPAY_WEBHOOK_SECRET=<secret configured on the Razorpay webhook>
```

Do not put actual secrets in this document or source control. With Razorpay configured, production startup now requires the webhook secret. Configure it for every process sharing this environment.

The billing worker checks up to 25 pending orders per pass, revisiting eligible orders on a roughly one-minute loop. Recovery latency grows with the pending-order backlog and provider latency. Monitor pending orders and reconciliation errors; the worker does not handle refunds or disputes.

## Payment integration verification

Configure the test-mode webhook URL as:

```text
https://<staging-host>/api/webhooks/razorpay
```

Subscribe to `payment.captured` and `order.paid`, using the same secret as the application setting. Signature verification uses the original request body and HMAC-SHA256, matching [Razorpay's webhook validation instructions](https://razorpay.com/docs/webhooks/validate-test//?preferred-country=US).

In Razorpay test mode, verify these scenarios before using live credentials:

- Open a new checkout while subscribed, then dismiss it. Existing paid access must remain available.
- Open two checkouts and finish the first. It must activate the correct order and preserve the existing paid-through time.
- Complete a payment and close the browser before its callback. The signed webhook should activate access.
- Repeat the same payment notification. There must be one Payment record and one extension of the paid-through date.
- Temporarily withhold the webhook and browser confirmation. With the billing worker running, a captured pending order must reconcile.
- Confirm that amount, currency, tenant, and provider order mismatches cannot activate a subscription.

The legacy migration path can recover an order still recorded in a tenant's old billing fields. It cannot recover all historical orders whose IDs were overwritten by the old implementation. Review such cases against provider records instead of guessing their payment state.

## Administrator access

A tenant `owner` or `admin` is not automatically a platform administrator. Grant access to an already verified, active user using the maintenance command in the intended environment:

```text
npm run admin:access -- owner@example.com grant
```

To remove access:

```text
npm run admin:access -- owner@example.com revoke
```

Then sign in normally and open `/admin`. Access is checked against the database for each admin request. Both `/admin` and `/admin-portal.html` are protected. The dashboard provides read-only overview counts and paginated records; it does not implement the old placeholder operations for account suspension, support tickets, or billing adjustments.

## API contract changes

- `POST /api/messages/send-template-bulk` now requires an `Idempotency-Key` header or `idempotencyKey` body field, with 1–160 characters. Reuse the same key and identical payload when retrying. Reusing it with different details returns 409. The portal generates and preserves its key in session storage until success.
- Contact, media, conversation, and group-member lists accept `after` and `limit` and return `nextCursor`. Limits are bounded to 500. An empty final page is possible when the previous page exactly filled the limit.
- `GET /api/inbox/conversations/:id/messages` returns the newest page and a `nextCursor`. Pass that cursor as `before` to load older messages.
- `POST /api/inbox/conversations/:id/read` requires `throughMessageId`, identifying the last message fetched for display. GET requests no longer clear unread counts.
- `POST /api/contacts/suppress` records a blocked or opted-out phone with a reason. Owner/admin permission is required. Restoring a contact through the contact editor requires explicit consent and evidence.
- Password recovery uses `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`. Reset links expire after 30 minutes, are single-use, and invalidate previous sessions. A missing SMTP configuration no longer prints the email body or reset/verification link into application logs.
- Campaign scheduling/execution and automation activation return 501. Draft storage and pausing remain available. Existing historical draft/active labels do not imply that an execution engine exists.

## Provider, email, and realtime checks

The focused [inbox WebSocket update](INBOX_REALTIME_2026-09-06.md) adds delivery/read notifications, session revocation, strict origin checks, and deployment requirements for HTTPS and the shared Redis service. Run `npm run check:realtime` for the real local browser/server integration check; its provider inputs are simulated.

Complete Meta Embedded Signup with the intended staging app. Verify phone ownership, event subscription, phone registration, template sync, consent suppression, queued delivery, inbound replies, and out-of-order status updates. The local tests simulate provider responses; they do not validate real app permissions or provider approval.

Send a real staging password-reset email and verification email. Confirm delivery, expired-link behavior, and the public URL in the message. Use a dedicated test account.

Run two HTTP/WebSocket processes and a separate webhook worker using the same Redis service. An inbound event handled by the worker should reach a browser connected to either HTTP process. Restart a subscriber and confirm that normal polling recovers missed updates. Redis pub/sub can miss messages while a subscriber is offline, so MongoDB and polling remain the durable source of inbox state. See the [Redis node-redis pub/sub guide](https://redis.io/docs/latest/develop/use-cases/pub-sub/nodejs/).

## Local verification commands and remaining release gates

```text
npm test
npm run check
npm run check:ui
npm audit --omit=dev
```

The browser script uses local Chrome on this Windows workspace. On another machine, set `UI_BROWSER_PATH` to a Chromium executable, or install Playwright Chromium with `npx playwright install chromium`. It starts a temporary local server and intercepts all API/provider requests. The integration tests start a disposable local MongoDB replica set and override the database and provider configuration; they do not connect to the deployed database.

Before a commercial launch, still verify realistic contact/message volumes, rate-limit behavior behind the actual reverse proxy, restore/recovery procedures, alerting, Safari/Firefox, keyboard/screen-reader behavior, and support handling for uncertain sends or payments. Confirm a truthful launch scope: immediate bulk sends and inbox functionality are implemented; scheduled campaigns and chatbot execution remain planned.
