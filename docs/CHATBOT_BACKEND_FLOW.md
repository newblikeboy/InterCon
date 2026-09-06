# ChatBot Backend Flow

The customer portal now has a ChatBot builder that saves draft visual flows through the existing automation API. These drafts define a trigger, reply/menu nodes, handoff nodes, and edges between them.

## Current Draft Endpoints

- `GET /api/automations`
  Lists the tenant's saved chatbot and automation drafts.

- `POST /api/automations`
  Creates a draft flow.

- `PUT /api/automations/:id`
  Updates an existing draft flow.

- `PATCH /api/automations/:id/status`
  Pauses or returns a flow to draft. Activating live auto-replies is still blocked until the runtime is built.

## Payload Shape

```json
{
  "name": "Welcome menu",
  "triggerType": "keyword",
  "triggerValue": "hi",
  "firstReply": "Hi! How can we help you today?",
  "routeTo": "human_agent",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger",
      "title": "Customer message",
      "keyword": "hi",
      "position": { "x": 28, "y": 34 }
    },
    {
      "id": "menu_1",
      "type": "menu",
      "title": "Welcome menu",
      "message": "Hi! How can we help you today?",
      "options": [
        { "label": "Sales", "nextNodeId": "handoff_sales" },
        { "label": "Support", "nextNodeId": "handoff_support" }
      ],
      "position": { "x": 300, "y": 34 }
    }
  ],
  "edges": [
    { "from": "trigger", "to": "menu_1", "label": "match" },
    { "from": "menu_1", "to": "handoff_sales", "label": "Sales" }
  ]
}
```

## Runtime To Build Next

1. Inbound WhatsApp webhook stores the customer message in Inbox as it does today.
2. A new automation runner loads active flows for that tenant.
3. The runner matches the incoming text against `triggerType=keyword` and `triggerValue`, starting with exact or normalized text matching such as `hi`, `hello`, or numbered replies.
4. The runner stores the conversation's active node so the next customer reply can continue the same flow.
5. For a `message` node, the runner sends the node message through the existing WhatsApp message service.
6. For a `menu` node, the runner sends the menu text and waits for the customer's next response. A response matching an option label or number moves to `nextNodeId`.
7. For a `handoff` node, the runner tags/routes the conversation to `sales`, `support`, `billing`, or `human_agent` and stops bot replies.
8. The runner must stop when an agent joins, the contact opts out, the contact is blocked, billing is inactive, or the WhatsApp 24-hour service window does not allow a free-form reply.
9. Every bot send and node transition should be written to an execution log for debugging and reporting.

## Runtime Endpoints To Add

- `POST /api/automations/:id/activate`
  Validates the graph, checks plan/WABA readiness, and marks the flow active.

- `POST /api/automations/:id/test`
  Runs a simulated customer message through the graph and returns each matched node without sending WhatsApp messages.

- `GET /api/automations/:id/executions`
  Shows recent conversations that entered the bot and their last node/status.

- Internal runner function:
  `runAutomationForInboundMessage({ tenantId, conversationId, contactId, text, receivedAt })`

