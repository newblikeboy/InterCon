// One-off backfill for inbox messages stored before the "unsupported message"
// wording fix. The old code baked Meta's engineer-facing error title
// ("Unsupported message — Message type unknown") straight into mediaCaption,
// so existing rows keep showing it even after the webhook handler was updated.
// Meta strips the original content, so there is nothing to recover here — this
// only rewrites the label to the agent-facing sentence and, where the original
// webhook payload is still retained, restores the diagnostic error code.
const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const InboxMessage = require("../models/InboxMessage");
const WebhookEvent = require("../models/WebhookEvent");

const NEW_CAPTION = "Unsupported message — WhatsApp could not forward this content. Ask the customer to resend it as text or media.";
const LEGACY_CAPTION_PATTERN = /^Unsupported message(?: — (?!WhatsApp could not forward).*)?$/;

// Rebuild the diagnostic string from any retained raw payload, keyed by the
// Meta message id. Matches describeMessageError() in webhook.service.js.
async function buildErrorIndex() {
  const index = new Map();
  const events = await WebhookEvent.find({ eventType: "messages" }).select("payload").lean();

  for (const event of events) {
    for (const message of event.payload?.value?.messages || []) {
      const err = Array.isArray(message.errors) ? message.errors[0] : null;
      if (!message.id || !err) continue;

      const parts = [];
      if (err.code) parts.push(`code ${err.code}`);
      const detail = err.error_data?.details || err.message || err.title || "";
      if (detail) parts.push(detail);
      if (message.unsupported?.type) parts.push(`unsupported.type=${message.unsupported.type}`);

      index.set(String(message.id), parts.join(" | ").slice(0, 1000));
    }
  }

  return index;
}

async function backfillUnsupportedMessages() {
  await connectDatabase();

  const errorIndex = await buildErrorIndex();
  const messages = await InboxMessage.find({ type: "unsupported" }).select("mediaCaption error metaMessageId");

  let captionsUpdated = 0;
  let errorsRestored = 0;
  let stillMissingDiagnostics = 0;

  for (const message of messages) {
    let dirty = false;

    if (LEGACY_CAPTION_PATTERN.test(String(message.mediaCaption || "").trim())) {
      message.mediaCaption = NEW_CAPTION;
      captionsUpdated += 1;
      dirty = true;
    }

    if (!message.error) {
      const recovered = errorIndex.get(String(message.metaMessageId || ""));
      if (recovered) {
        message.error = recovered;
        errorsRestored += 1;
        dirty = true;
      } else {
        // Payload already pruned by WEBHOOK_RETENTION_DAYS — nothing to recover.
        stillMissingDiagnostics += 1;
      }
    }

    if (dirty) await message.save();
  }

  console.log(`Scanned ${messages.length} unsupported message(s).`);
  console.log(`Rewrote ${captionsUpdated} legacy caption(s).`);
  console.log(`Restored ${errorsRestored} diagnostic error string(s) from retained webhook payloads.`);
  if (stillMissingDiagnostics > 0) {
    console.log(`${stillMissingDiagnostics} message(s) had no retained payload (pruned by WEBHOOK_RETENTION_DAYS) — diagnostics unavailable for those.`);
  }
}

backfillUnsupportedMessages()
  .catch((error) => {
    console.error("Failed to backfill unsupported inbox messages:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (env.mongoUri) {
      await mongoose.connection.close();
    }
  });
