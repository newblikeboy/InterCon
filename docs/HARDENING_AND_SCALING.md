# InterCon Hardening and Scaling Runbook

## Production topology

Run these as independent processes:

1. `npm start` — stateless HTTP API and portal
2. `npm run worker:messages` — outbound message delivery
3. `npm run worker:webhooks` — inbound webhook/event processing

Run at least two HTTP instances and two worker instances for availability.
MongoDB and Redis must be managed, authenticated, encrypted services. Redis is
required in production for shared rate limits, session/API-key caches,
concurrency leases, and sender throttling.

## Required production settings

Use a managed secret store. Do not deploy production credentials from a
OneDrive-synchronized `.env` file.

Required settings include:

- `NODE_ENV=production`
- `CLIENT_ORIGIN=https://...`
- `MONGODB_URI`
- `REDIS_URL`
- distinct `JWT_SECRET` and `DATA_ENCRYPTION_KEY`, each at least 32 characters
- `METRICS_TOKEN`, at least 32 characters
- Meta webhook/app credentials
- Razorpay and Cloudinary credentials when those features are enabled
- `TRUST_PROXY` matching the exact reverse-proxy topology

The application refuses to start in production when critical security
settings are missing. Rotate any secret that has been copied into logs,
screenshots, chat, source control, or synchronized personal storage.

## Edge controls

Place the application behind an HTTPS load balancer or reverse proxy that:

- overwrites `X-Forwarded-For`, `X-Forwarded-Host`, and `X-Forwarded-Proto`
- limits connection and request body rates
- enforces TLS 1.2 or newer
- provides DDoS/WAF protection
- blocks unexpected HTTP methods
- preserves `X-Request-Id`

Do not set `TRUST_PROXY=true` without knowing the proxy path. Prefer the exact
hop count or trusted proxy network.

## Rate limits

Rate limits are stored in Redis and separated by purpose:

- login and signup abuse protection
- portal/API traffic
- public API-key traffic
- media uploads
- inbox polling
- high-volume webhook ingress

Public API traffic is keyed by API key rather than client IP. Provider webhook
traffic has a separate high allowance and still requires a valid provider
signature.

## Queue behavior

Webhook requests are signature-verified, durably inserted into MongoDB, and
acknowledged before business processing. The webhook worker uses atomic claims,
retry jitter, stale-lock recovery, and a dead-event state.

Outbound messages use:

- atomic MongoDB claims
- Redis-coordinated per-phone and per-recipient pacing
- rolling unique-recipient reservations
- bounded provider HTTP calls
- circuit breaking and `Retry-After` handling
- an `uncertain` state when automatic retry could create a duplicate

Monitor `dead` webhook events and `uncertain` messages. They require operator
review.

## Database and retention

Startup verifies critical unique and queue indexes. It refuses to continue if
existing duplicate Meta ownership or provider message IDs would make a unique
index unsafe.

Raw webhook events expire after `WEBHOOK_RETENTION_DAYS`. Recipient pacing
records and onboarding sessions also have TTL indexes. Backups must be
encrypted and restoration must be tested.

### Customer contact encryption

Customer names, phone numbers, email addresses and cities in `Contact` are
encrypted with AES-256-GCM before MongoDB writes. Exact phone lookup fields
store a keyed HMAC instead of the number; a hidden companion stores randomized
ciphertext so authorized tenant services can recover the original number.
The same protection covers phone copies in conversations, inbox messages,
outbound messages and recipient pacing records. Message text, personalized
variables, queued webhook payloads, automation execution plans, batch results
and contact-status reasons are also encrypted. Trial recipient ledgers and
Redis recipient identifiers use keyed HMACs where recovery is unnecessary.

Existing authentication and tenant permissions still decide who can read data.
Authorized contact lists, inboxes, exports and message delivery receive normal
values; this does not hide data from a compromised application or someone who
possesses its encryption key. Platform administrators retain their existing
authorized access. Disk encryption and TLS remain necessary.

Contact substring search uses keyed three-character tokens to find candidates,
then checks decrypted names/numbers before pagination. Searches shorter than
three characters scan the tenant's candidates. Search indexes reveal repeated
tokens and some length information, not their plaintext; access and key controls
still matter. Never add plaintext secondary indexes to restore search.

The stable `DATA_ENCRYPTION_KEY` must be at least 32 characters and distinct
from `JWT_SECRET` in production. Encryption and lookup keys are derived for
separate purposes, with model/field binding for authenticated ciphertext.
Keep the key in a secret manager with recovery access; do not rotate it or
replace it without a separate decrypt/re-encrypt migration. Losing it loses
access to encrypted data. The new customer-data envelopes are independent of
the existing Meta-token envelope and do not change that token format.

Migration of existing rows is explicit. First back up MongoDB and the key and
test restoration, then stop all app instances and message/webhook/billing
workers. With the intended environment loaded:

```powershell
npm run encrypt:customer-data
npm run encrypt:customer-data -- --apply
npm run encrypt:customer-data
npm run db:indexes
```

The command defaults to read-only inspection and reports counts without contact
values. `--apply` rewrites legacy fields without changing record IDs or business
timestamps. It verifies existing ciphertext, skips already protected fields,
and compares original values to avoid overwriting concurrent edits. Repeat if
conflicts are reported; the final inspection should have zero pending rows.
All app instances and workers must then restart on this code and the same key;
old binaries cannot read the protected representation. Rollback requires a
compatible reader or restoring the pre-migration backup, not just old code.
Legacy plaintext reads are supported only to make migration safe; they do not
mean an un-migrated collection is encrypted.

Old Redis recipient keys/members expire under their existing TTLs (daily
recipient data can last up to 48 hours); the change does not flush live rate
limits. Backups taken before migration still contain the previous field
representation and need their own access, encryption and expiry controls.
Contact source labels, consent references/purpose, suppression reasons, media
metadata and privacy-request notes are also encrypted by the current models.
Business/account profiles and contact tags remain outside this field-encryption
scope; avoid storing patient details in them. Uploaded file bytes use
Cloudinary's authenticated storage, separately from database field encryption.
See [the October privacy rollout](DPDP_ROLLOUT_2026-10-29.md) for private-media
migration, report recipient controls, retention, consent and rights workflows.
These controls do not constitute a DPDP compliance certification.

## Media

See [number-specific media delivery](RECIPIENT_MEDIA_DELIVERY.md) for the
single-request API and portal workflow, recipient-number binding, safe retry
receipts, reverse-proxy limits, recovery and retention. Recipient-specific files
are private, excluded from shared template samples, and checked again by the
message worker before delivery. Existing common-media bulk sending remains a
separate workflow.

Uploads use disk-backed temporary files rather than process memory. The server:

- validates file signatures instead of trusting browser MIME headers
- rejects unsupported formats such as SVG
- limits upload rate and concurrency
- enforces per-workspace asset and storage quotas
- removes temporary files after each request

The host temporary directory must have enough space and should be isolated
from application/source directories.

## Monitoring

- Liveness: `GET /api/health`
- Readiness: `GET /api/health/ready`
- Metrics: `GET /api/health/metrics` with `Authorization: Bearer METRICS_TOKEN`

Alert on:

- readiness failures
- HTTP 5xx and 429 rates
- provider timeout/circuit-open counters
- queue age and queue depth
- webhook `dead` events
- messages in `uncertain`
- MongoDB/Redis connection saturation
- memory, CPU, disk, and event-loop latency

Set an initial availability objective, for example 99.9%, and define error and
latency budgets from measured production traffic.

## Verification commands

```text
npm run check
npm test
npm run audit:prod
npm run load:smoke -- https://staging.example.com/api/health
```

Run load tests only against an isolated staging environment with representative
MongoDB and Redis capacity. Do not use production customer traffic for load
testing.

## Deployment sequence

1. Back up MongoDB.
2. Provision Redis and the managed secrets.
3. Deploy the API with one instance and verify database indexes/readiness.
4. Start the webhook worker.
5. Start the message worker.
6. Run security and staging smoke tests.
7. Scale API and workers gradually while observing queue depth and provider
   response headers.
8. Enable WAF rules and alerts before opening public traffic.


## September 2026 review fixes

See [the rollout instructions](PRODUCTION_ROLLOUT_2026-09-06.md) for database indexes, the new payment webhook secret, billing worker, platform-administrator provisioning, and API contract changes.
