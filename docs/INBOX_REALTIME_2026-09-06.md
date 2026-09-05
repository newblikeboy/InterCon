# Inbox realtime update: plain-language explanation

Implemented locally on 6 September 2026. These changes have not been deployed to the live application.

## Why refreshing was necessary

WhatsApp's delivery updates were saved in the database, but that part of the backend did not notify the open inbox. The screen kept its old status until it fetched the messages again. Its polling fallback could leave the old ticks visible for about a minute.

## What changed

The backend now announces a delivery-status change after saving it. An authenticated WebSocket carries that announcement to the correct business's open inbox. The browser updates the message's ticks immediately. New replies also trigger an automatic inbox update, and reconnecting fetches any messages missed while disconnected.

An old update cannot turn a message that is already read back into merely sent. This protection applies to delayed provider updates and stale browser fetches. Failed messages have an explicit failure indicator.

The socket carries small change notices: message/conversation identifiers and, where applicable, status. Message text still comes through the existing authenticated inbox API. Sending a message continues through the authenticated HTTP API; the socket handles live notifications.

## How access is protected

- The socket requires the signed login cookie and an approved website origin. Tokens in URLs and client-selected business rooms are rejected.
- The server checks the current user and business in the database. A browser cannot join another business by changing an identifier.
- Current authorization is checked before delivering notifications. Logout and password reset close the user's existing connections, including through the shared notification bus. Expired sessions close automatically; disabled users or businesses lose access. If authorization cannot be checked, the server closes the connection without sending the event.
- Browser notifications use an explicit field allowlist. They exclude message bodies, contact phone numbers, credentials, and provider error details.
- Connections have per-user and process limits, bounded incoming frames and outgoing buffers, and heartbeat checks. Client message frames cannot trigger a send or subscription.

The approach follows the relevant origin, session, authorization, and resource-limit guidance in the [OWASP WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html). These controls and local tests do not establish that the entire deployed system has no vulnerabilities.

## Verification

- `npm test`: 41 tests passed. Coverage includes cross-business isolation, rejected origins and forged claims, logout, expiry, suspended accounts, unavailable authorization storage, connection/frame limits, and notifications plus session revocation across isolated server instances using a simulated shared Redis transport.
- `npm run check:realtime`: passed with a real local Chrome browser, HTTP/WebSocket server, and disposable MongoDB replica set. Delivery and read ticks updated without reloading; a live reply appeared; reconnection recovered an offline reply. Only the initial page navigation occurred. Provider input was simulated.
- `npm run check:ui`: 24 browser checks passed.
- `npm run check`: syntax passed for 107 JavaScript files.

The latest [browser results](review-2026-09-06/realtime/browser-results.json) and [mobile screenshot](review-2026-09-06/realtime/inbox-live-mobile.png) are saved alongside this report. Local status updates took 94 ms each in that run; this is not a production latency guarantee.

## Deployment requirements

1. Deploy and restart the HTTP servers and webhook workers with the same release. The status notification is produced by the webhook handler, so updating only the browser or HTTP server is insufficient.
2. Serve the portal over HTTPS. The browser then uses `wss://<portal-host>/ws`. Configure the reverse proxy to forward WebSocket upgrades on `/ws`, preserve the browser Origin header, and allow the heartbeat connection to remain open. Keep the plain HTTP Node port private behind that proxy.
3. Set production `CLIENT_ORIGIN` to the exact portal origin, such as `https://app.example.com`, without a page path. Production startup requires HTTPS. An unexpected or missing Origin is rejected.
4. All HTTP instances and webhook workers must use the same trusted Redis service for this environment. Restrict Redis network access and credentials to application services; use TLS (`rediss://`) when traffic crosses an untrusted network. Separate staging and production Redis services: the pub/sub channel is shared by name, and Redis database numbers do not isolate pub/sub.
5. In staging, confirm a real signed WhatsApp delivery/read webhook updates an open inbox through the deployed proxy. Test with two businesses and two HTTP instances, then disconnect/reconnect a browser and log out from another tab.

Redis pub/sub is not a durable message store. MongoDB remains the source of truth; reconnection and polling recover missed notifications. A Redis outage can delay updates from separate workers until polling catches up. Live Meta delivery, a real shared Redis deployment, the production TLS proxy, and high-volume traffic still require deployment validation.
