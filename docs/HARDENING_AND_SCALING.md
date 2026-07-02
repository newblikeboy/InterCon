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

## Media

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

