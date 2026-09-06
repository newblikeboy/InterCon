# Free WhatsApp allowance

Active workspaces can use InterCon without a subscription until they have sent
WhatsApp messages to 20 distinct recipient phone numbers. Contact creation,
imports, incoming messages, and queueing messages do not consume the allowance.
Repeat sends to the same normalized phone count once. Once recipient 20 is
accepted, every further send requires an active paid plan, including repeats.
Meta messaging charges still apply separately.

The allowance is lifetime and shared across templates, bulk sends, API sends,
inbox replies, chatbot replies, users, and connected sending numbers within a
workspace. Existing saved outbound history seeds the counter on first access.
The counter survives contact/chat deletion, login, and subscription changes.
Paid sends also contribute toward the lifetime count, capped at 20.

An accepted send means Meta returned a successful response with a message ID.
Later delivery failures do not undo provider acceptance. Definite provider
rejections release capacity. MongoDB atomically reserves capacity before the
provider call so concurrent workers and inbox requests cannot exceed the limit.
When the final slot is awaiting a result, further free sends wait. Unknown
delivery outcomes retain their slots until resolved; they must not be blindly
retried or cleared. Saved acceptance evidence automatically repairs failed quota
bookkeeping. If no acceptance evidence was saved, an operator must investigate
the delivery before resolving its reservation.

Queued messages beyond the allowance fail with a payment-required explanation;
they are not automatically sent when a subscription is purchased. The user can
select the unsent recipients and submit a new batch after payment. Trial-capacity
contention reschedules queued messages without consuming provider retries.

## Performance

Queued sends and inbox replies reuse the tenant already loaded for their initial
access check. Every provider send still reads current access immediately before
sending; paid access is not cached. Once initialized, a paid queued send at the
20-recipient cap uses two tenant reads and no tenant writes, down from three reads
and one write. Paid repeat recipients below the cap also skip redundant writes.

Free sends with available capacity reserve and complete in two tenant writes.
Completion removes the reservation in the same update; a separate removal is
needed only when a concurrent send has already filled the counter. Ordinary send
checks do not scan outbound history for in-flight reservations. A full reservation
pool triggers recovery and one atomic retry. Billing reads still reconcile saved
acceptance evidence, and unknown outcomes remain reserved.

Recovery queries have compound indexes for tenant, recipient, and acceptance/send
time. Existing workspaces still seed their lifetime usage from history on first
access, so this one-time cost depends on history size.

Routine sender, inbox, and chatbot usage refreshes use `/api/billing?summary=1`,
which omits the payment-history query. Billing/payment pages retain full history.
Actions with locally available access proceed to server validation without a
billing preflight. A server rejection updates the displayed allowance; local
state never authorizes delivery. Inbox replies refresh usage in the background.

## Deployment

No new environment variables or dependencies are required. Deploy the same
version to the API and all message/webhook workers, then restart those processes.
Drain old workers before allowing free sends so they cannot use the old billing
rules. No Nginx configuration change is required.
The normal database startup check creates the two new recovery indexes. They can
also be provisioned ahead of the restart using `npm run db:indexes`; initial index
build time depends on collection size.

Validation: `npm test`, `npm run check`, and `npm run check:ui`. Provider calls in
the tests are mocked; database tests use an isolated MongoDB replica set.
