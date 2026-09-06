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

## Deployment

No new environment variables or dependencies are required. Deploy the same
version to the API and all message/webhook workers, then restart those processes.
Drain old workers before allowing free sends so they cannot use the old billing
rules. No Nginx configuration change is required.

Validation: `npm test`, `npm run check`, and `npm run check:ui`. Provider calls in
the tests are mocked; database tests use an isolated MongoDB replica set.
