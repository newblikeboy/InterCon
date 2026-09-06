const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const InboxMessage = require("../models/InboxMessage");
const Contact = require("../models/Contact");
const ContactSegment = require("../models/ContactSegment");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { requirePlatformAccess, sendWhatsAppWithAccess, getAccessTenant } = require("./platformAccess.service");
const { publishInboxUpdated } = require("./realtime.service");
const { cursorFilter, pageSize } = require("../utils/pagination");

// Meta's customer-service window: free-form (non-template) replies are only
// permitted within 24 hours of the customer's most recent inbound message.
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function getWindowState(conversation) {
  const lastInboundAt = conversation?.lastInboundAt
    ? new Date(conversation.lastInboundAt)
    : null;

  if (!lastInboundAt) {
    return { windowOpen: false, windowExpiresAt: null };
  }

  const expiresAt = new Date(lastInboundAt.getTime() + SERVICE_WINDOW_MS);
  return {
    windowOpen: expiresAt.getTime() > Date.now(),
    windowExpiresAt: expiresAt
  };
}

function publicConversation(conversation, groupNamesByTag = new Map()) {
  const windowState = getWindowState(conversation);
  const populatedContact = conversation?.contactId && typeof conversation.contactId === "object"
    ? conversation.contactId
    : null;
  const tags = Array.isArray(populatedContact?.tags)
    ? populatedContact.tags.filter(Boolean)
    : [];
  const groupDetails = tags.flatMap((tag) => (
    (groupNamesByTag.get(tag) || []).map((name) => ({ name, tag }))
  ));
  const groups = [...new Set(groupDetails.map((group) => group.name))];
  const manualTags = tags.filter((tag) => !groupNamesByTag.has(tag));

  return {
    id: String(conversation._id),
    contactId: populatedContact?._id
      ? String(populatedContact._id)
      : conversation.contactId
        ? String(conversation.contactId)
        : null,
    customerPhone: conversation.customerPhone,
    customerName: conversation.customerName || populatedContact?.name || conversation.customerPhone,
    tags,
    groups,
    groupDetails,
    manualTags,
    lastMessageText: conversation.lastMessageText || "",
    lastMessageAt: conversation.lastMessageAt,
    lastDirection: conversation.lastDirection || "in",
    unreadCount: conversation.unreadCount || 0,
    windowOpen: windowState.windowOpen,
    windowExpiresAt: windowState.windowExpiresAt
  };
}

function publicMessage(message) {
  return {
    id: String(message._id),
    direction: message.direction,
    type: message.type || "text",
    text: message.text || "",
    mediaCaption: message.mediaCaption || "",
    status: message.status || (message.direction === "in" ? "received" : "sent"),
    edited: Boolean(message.edited),
    revoked: Boolean(message.revoked),
    error: message.error || "",
    sentAt: message.sentAt || message.createdAt
  };
}

async function listConversations(tenantId, query = {}) {
  const limit = pageSize(query.limit, 100, 500);
  const [conversations, segments] = await Promise.all([
    Conversation.find({ tenantId, ...cursorFilter(query.after) })
      .populate({ path: "contactId", model: Contact, select: "name tags" })
      .sort({ _id: -1 })
      .limit(limit)
      .lean(),
    ContactSegment.find({ tenantId })
      .select("name tag")
      .lean()
  ]);
  const groupNamesByTag = segments.reduce((map, segment) => {
    const tag = String(segment.tag || "").trim();
    if (!tag) return map;
    map.set(tag, [...(map.get(tag) || []), segment.name]);
    return map;
  }, new Map());

  const { totalUnread } = await getUnreadSummary(tenantId);

  return {
    conversations: conversations.map((conversation) => publicConversation(conversation, groupNamesByTag)),
    totalUnread,
    nextCursor: conversations.length === limit ? String(conversations.at(-1)._id) : null
  };
}

async function getUnreadSummary(tenantId) {
  const result = await Conversation.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)) } },
    { $group: { _id: null, totalUnread: { $sum: "$unreadCount" } } }
  ]);

  return { totalUnread: result[0]?.totalUnread || 0 };
}

async function loadConversation(tenantId, conversationId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new HttpError(400, "Conversation ID is invalid");
  }

  const conversation = await Conversation.findOne({ _id: conversationId, tenantId });
  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  return conversation;
}

async function getConversationMessages(tenantId, conversationId, query = {}) {
  const conversation = await loadConversation(tenantId, conversationId);
  const limit = pageSize(query.limit, 200);

  const messages = await InboxMessage.find({ tenantId, conversationId: conversation._id, ...cursorFilter(query.before) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  messages.reverse();

  return {
    conversation: publicConversation(conversation),
    messages: messages.map(publicMessage),
    nextCursor: hasMore ? String(messages[0]._id) : null
  };
}

async function markConversationRead(tenantId, conversationId, body = {}) {
  const conversation = await loadConversation(tenantId, conversationId);
  if (!mongoose.Types.ObjectId.isValid(body.throughMessageId)) throw new HttpError(400, "Last displayed message is required");
  const lastSeen = await InboxMessage.findOne({ _id: body.throughMessageId, tenantId, conversationId }).lean();
  if (!lastSeen) throw new HttpError(404, "Displayed message not found");
  const lastStoredFilter = conversation.lastStoredMessageId
    ? { lastStoredMessageId: lastSeen._id }
    : { lastStoredMessageId: { $exists: false }, lastMessageAt: { $lte: lastSeen.sentAt || lastSeen.createdAt } };
  await Conversation.updateOne({ _id: conversation._id, tenantId, ...lastStoredFilter }, { $set: { unreadCount: 0 } });
  return publicConversation(await loadConversation(tenantId, conversationId));
}

async function deleteConversation(tenantId, conversationId) {
  await getAccessTenant(tenantId);
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new HttpError(400, "Conversation ID is invalid");
  }

  const conversation = await Conversation.findOneAndDelete({
    _id: conversationId,
    tenantId
  });
  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  const result = await InboxMessage.deleteMany({
    tenantId,
    conversationId: conversation._id
  });

  return {
    conversationId: String(conversation._id),
    deletedMessages: result.deletedCount || 0
  };
}

async function sendReply(tenantId, conversationId, body = {}) {
  await requirePlatformAccess(tenantId);

  const text = String(body.text || body.message || "").trim();
  if (!text) {
    throw new HttpError(400, "Reply text is required");
  }
  if (text.length > 4096) {
    throw new HttpError(400, "Reply text must be 4096 characters or fewer");
  }

  const conversation = await loadConversation(tenantId, conversationId);
  const { windowOpen, windowExpiresAt } = getWindowState(conversation);
  const contact = await Contact.findOne({ tenantId, phone: conversation.customerPhone }).lean();
  if (!contact || contact.status !== "active") throw new HttpError(403, "This contact is blocked or opted out");

  if (!windowOpen) {
    throw new HttpError(
      409,
      "The 24-hour customer service window has closed. Use an approved template to contact the customer; free-form replies remain unavailable until the customer sends a new message.",
      { code: "SERVICE_WINDOW_CLOSED" }
    );
  }

  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant?.meta?.phoneNumberId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. Phone number ID and Meta access token are required before replying.");
  }

  const { response, metaResponse } = await sendWhatsAppWithAccess(tenantId, conversation.customerPhone, `https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: conversation.customerPhone,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  if (!response.ok || metaResponse.error) {
    const metaError = metaResponse.error || {};
    throw new HttpError(response.status || 400, metaError.message || "Failed to send WhatsApp reply", metaError);
  }

  const metaMessageId = metaResponse.messages?.[0]?.id || "";
  if (!metaMessageId) throw new HttpError(502, "WhatsApp delivery outcome is unknown. Check the conversation before retrying.");
  const sentAt = new Date();

  const message = await InboxMessage.create({
    tenantId,
    conversationId: conversation._id,
    contactId: conversation.contactId,
    customerPhone: conversation.customerPhone,
    direction: "out",
    type: "text",
    text,
    metaMessageId,
    status: "sent",
    sentAt
  });

  conversation.lastMessageText = text.slice(0, 1000);
  conversation.lastMessageAt = sentAt;
  conversation.lastDirection = "out";
  if (!body.automationSend) {
    conversation.automation = {
      status: "idle",
      currentNodeId: "",
      routeTo: "",
      updatedAt: sentAt
    };
  }
  await Conversation.updateOne({ _id: conversation._id, tenantId }, { $max: { lastStoredMessageId: message._id } });
  const conversationUpdate = {
    lastMessageText: text.slice(0, 1000),
    lastMessageAt: sentAt,
    lastDirection: "out",
    ...(!body.automationSend ? {
      automation: {
        status: "idle",
        currentNodeId: "",
        routeTo: "",
        updatedAt: sentAt
      }
    } : {})
  };
  await Conversation.updateOne({ _id: conversation._id, tenantId, lastMessageAt: { $lte: sentAt } }, { $set: conversationUpdate });

  await publishInboxUpdated(tenantId, {
    action: "message_sent",
    conversationId: String(conversation._id),
    messageId: String(message._id),
    customerPhone: conversation.customerPhone,
    lastMessageAt: sentAt
  });

  return {
    conversation: publicConversation(conversation),
    message: publicMessage(message),
    windowExpiresAt
  };
}

module.exports = {
  listConversations,
  getUnreadSummary,
  getConversationMessages,
  markConversationRead,
  deleteConversation,
  sendReply
};
