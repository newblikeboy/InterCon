# Rule-based chatbot runtime

The chatbot uses deterministic rules only. There is no AI interpretation or model API dependency.

## Customer behavior

- `Hi`, `restart`, `menu`, and `main menu` restart the current live flow from any bot-controlled state. Matching ignores capitalization, repeated spaces, and trailing greeting punctuation (`Hi!`). The configured keyword also starts/restarts the flow.
- Menu selections accept the displayed number or full option label. Other replies receive guidance and the numbered menu again. Unknown initial messages receive the first response with guidance.
- Menu sessions expire after 24 hours without a bot transition. The next message restarts the current flow. Missing flow/node state also recovers instead of silently waiting forever.
- Message blocks follow their `nextNodeId` or outgoing edge automatically until a menu, handoff, or message with no next block. Automatic loops are rejected. Menu loops are permitted because each requires another customer selection.
- A menu stores a snapshot of the graph that produced it. Valid live edits apply to new/restarted sessions; existing sessions finish against their snapshot. Sessions created before this update recover if their old block disappears.
- A handoff, agent reply in Inbox, or new business-app message echo pauses the bot for that conversation. Customer restart commands do not interrupt human takeover. An agent must use **Release to chatbot**; only subsequently stored inbound messages are eligible. **Take over** also works without sending a message.
- Pausing a flow clears waiting menu state without releasing human handoffs. Concurrent launches are serialized so a tenant has one active flow.

Contact suppression, the service window, workspace access, and billing checks still apply to every send. A restart cannot bypass them. Legacy `controls` fields remain in stored payloads for compatibility; recovery prompts, human holds, and send eligibility checks are mandatory behavior.

## Builder and validation

Trigger and message blocks expose a **Next block** selector. Menus use option destinations; handoffs end bot execution. A message with no next block ends the flow.

Launch and live edits require exactly one keyword trigger, a connected first reply, reply text, valid destinations, unambiguous labels/numbers, reachable blocks, and no automatic loops. Unsupported triggers cannot launch. Drafts can remain incomplete. Conflicting saves require a reload.

An invalid legacy live graph produces a recovery notice and enters human handoff when sending is permitted. Activity records the validation reason. Repair the graph and release affected conversations to resume automation.

**Test flow** simulates current unsaved builder contents. Enter one customer message per line. The same planning function used in production returns replies, final blocks, and reasons for each turn. It neither saves customer state nor sends WhatsApp messages. Each simulation starts a fresh conversation.

## Durable processing and delivery

1. Inbound message storage and its `AutomationExecution` job commit in the same MongoDB transaction. A stored inbound message has a recoverable automation job even if immediate processing fails.
2. A monotonic conversation sequence, allocated in that transaction, orders jobs across workers. Messages whose provider timestamps precede the last processed turn are recorded as `stale_message` and cannot rewind the journey. True provider order cannot be reconstructed if messages arrive out of order.
3. A MongoDB lease permits one automation processor per conversation, with a two-minute expiry and heartbeat. Later turns remain queued during sends/retries. Other customers remain eligible.
4. The execution saves its plan and checkpoints every outgoing step. Each accepted Inbox message records the execution ID and step with a unique index.
5. Definite temporary provider rejections (429, 5xx, or explicitly transient errors) and a pre-send open circuit retry with bounded exponential backoff, up to five attempts. Permanent failures are recorded.
6. Timeouts, disconnections, or a worker crash during sending without acceptance evidence are recorded as `uncertain`. They are not automatically resent because Meta may have accepted them. If the accepted Inbox record exists, processing reconciles that step without another send.
7. Human takeover/release records a sequence cutoff. Bot completion cannot overwrite it, and old queued turns are discarded. An external send already in flight may finish; subsequent blocks stop when takeover is observed.
8. The existing webhook worker drains queued/retry automation jobs. Immediate processing is an optimization; the durable job survives worker interruptions or notification failures.

**Recent chatbot activity** shows the latest 100 execution records across the tenant with retries, failures, handoffs, stale messages, validation errors, and conversation links. Delivery status comes from outgoing Inbox messages: completed execution means accepted, not necessarily delivered or read. Later provider delivery failures appear separately. Completed diagnostics expire after 30 days; pending jobs do not expire automatically.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/automations` | List flows |
| `POST /api/automations` | Create draft |
| `PUT /api/automations/:id` | Save draft/live flow with validation and revision check |
| `PATCH /api/automations/:id/status` | Launch, pause, or return to draft |
| `POST /api/automations/simulate` | `{ flow: <builder payload>, messages: ["Hi", "help", "1"] }`, or use `flowId` |
| `GET /api/automations/executions` | Activity; optional `flowId`/`conversationId` filters |
| `PATCH /api/inbox/conversations/:conversationId/automation` | `{ action: "takeover" }` or `{ action: "release" }` |

Automation management, simulation, and diagnostics require an authenticated owner/admin. Inbox controls require a user in the conversation's tenant. The public reply endpoint accepts only reply text; clients cannot identify themselves as internal automation sends.

## Rollout and verification

- MongoDB must support transactions, as already required by inbound Inbox storage.
- Run `npm run db:indexes` for the new execution, lease, and accepted-step indexes before starting updated workers. API startup also provisions project indexes.
- Deploy/restart both the API and all webhook workers. Avoid mixed old/new workers: old code ignores the new handoff and processing rules. Keep `npm run worker:webhooks` running for crash recovery and retries. No separate automation worker or AI credentials are needed.
- Verify with `npm test`, `npm run check`, and `npm run check:chatbot`. Tests use an isolated database and simulated provider/API traffic, never live WhatsApp sends.
- Review **Test flow > Recent chatbot activity** for `retry`, `failed`, and `uncertain` outcomes. Inspect uncertain conversations before manually resending.

Coverage includes restart/fallback, expiry, snapshots/live edits, graph validation, message chains, takeover/release, concurrent launches, duplicate webhooks, atomic job storage, ordered processing, retry checkpoints, uncertain outcomes, worker-crash recovery, suppression, tenant isolation, simulator parity, and desktop/mobile browser controls.
