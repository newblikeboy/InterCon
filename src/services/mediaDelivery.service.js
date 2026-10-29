const crypto = require("crypto");
const fs = require("fs");
const Receipt = require("../models/MediaDelivery");
const Media = require("../models/MediaAsset");
const Message = require("../models/Message");
const Audit = require("../models/SecurityAudit");
const media = require("./media.service");
const messages = require("./message.service");
const { lookup } = require("../utils/privateData");
const HttpError = require("../utils/httpError");
const yes = value => [true, "true", "on"].includes(value);
const LEASE_MS = 10 * 60 * 1000;

function input(body, key, reportMetadataHash) {
  if (typeof key !== "string" || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new HttpError(400, "Provide a unique Idempotency-Key of 8 to 160 letters, digits, dots, colons, hyphens or underscores");
  if (body.idempotencyKey && body.idempotencyKey !== key) throw new HttpError(400, "Conflicting idempotency keys");
  if (body.contactIds || body.groupIds || body.recipients || body.contactId || body.recipientContactId) throw new HttpError(400, "Send exactly one number in to; recipient lists and contact overrides are not accepted");
  const raw = body.to ?? body.phone;
  if (typeof raw !== "string" || !/^\+?[0-9 ()-]+$/.test(raw)) throw new HttpError(400, "Provide one WhatsApp number in to, including country code");
  let to = raw.replace(/[^0-9]/g, "");
  if (/^[6-9]\d{9}$/.test(to)) to = "91" + to;
  if (!/^\d{11,15}$/.test(to)) throw new HttpError(400, "WhatsApp number must include country code");
  if (body.phone && body.to && String(body.phone).replace(/\D/g, "") !== String(body.to).replace(/\D/g, "")) throw new HttpError(400, "Conflicting recipient numbers");
  if (!yes(body.permissionConfirmed)) throw new HttpError(400, "Confirm authority and the necessary recipient permission for this delivery");
  const purpose = String(body.purpose || "general");
  if (!["general", "patient_report"].includes(purpose)) throw new HttpError(400, "Choose general business media or patient_report");
  let variables;
  try { variables = typeof body.variables === "string" ? JSON.parse(body.variables) : body.variables || []; }
  catch { throw new HttpError(400, "variables must be a JSON array of text values"); }
  if (!Array.isArray(variables) || variables.length > 100 || variables.some(value => typeof value !== "string" || !value.trim() || value.length > 4096)) throw new HttpError(400, "variables must contain non-empty text values of at most 4096 characters");
  const name = String(body.name || "").trim(), reference = String(body.consentReference || "").trim();
  if (name.length > 120 || reference.length > 240) throw new HttpError(400, "Recipient name or permission reference is too long");
  return { to, name, purpose, variables: variables.map(value => value.trim()),
    templateName: String(body.templateName || "").trim(), language: String(body.language || "").trim(),
    consentScope: String(body.consentScope || "service_only"), consentReference: reference,
    ...(reportMetadataHash ? { reportMetadataHash } : {}) };
}

async function digestFile(file) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(file.path)) hash.update(chunk);
  return hash.digest("hex");
}
function result(receipt, message, idempotent) {
  return { queued: true, idempotent, deliveryId: String(receipt._id), messageId: String(message._id),
    mediaId: message.mediaId, status: message.status };
}
async function reconcile(receipt) {
  const message = await Message.findOne({ tenantId: receipt.tenantId, idempotencyKey: `media-delivery:${receipt._id}` }).lean();
  if (!message) return null;
  await Receipt.updateOne({ _id: receipt._id, status: { $ne: "erased" } }, { $set: { status: "queued", messageId: message._id, mediaId: message.mediaId }, $unset: { leaseToken: "", leaseUntil: "" } });
  return result(receipt, message, true);
}

async function sendMedia(tenantId, file, body, key, actor = {}, reportOptions = {}) {
  const libraryId = String(body.mediaId || "").trim();
  if (libraryId && file?.path) throw new HttpError(400, "Choose a library file or upload a file, not both");
  let libraryAsset;
  if (libraryId) {
    libraryAsset = await Media.findOne({ tenantId, mediaId: libraryId }).select("+recipientHash").lean();
    if (!libraryAsset || !media.isRecipientMedia(libraryAsset)) throw new HttpError(400, "Choose a unique file from this workspace's media library");
    if (body.purpose && body.purpose !== libraryAsset.purpose) throw new HttpError(400, "The selected file has a different media purpose");
    body = { ...body, purpose: libraryAsset.purpose, consentReference: body.consentReference || libraryAsset.consentReference };
  }
  const payload = input(body, key, reportOptions.reportMetadataHash);
  if (!file?.path && !libraryAsset) throw new HttpError(400, "Attach one photo, video or PDF, or choose a unique library file");
  if (libraryAsset) payload.mediaId = libraryId;
  const fileHash = libraryAsset ? `library:${libraryId}` : await digestFile(file);
  const keyHash = lookup(`delivery:${key}`, `MediaDelivery.key:${tenantId}`);
  const fingerprint = lookup(JSON.stringify({ ...payload, fileHash }), `MediaDelivery.request:${tenantId}`);
  const token = crypto.randomUUID();
  let receipt;
  try {
    receipt = await Receipt.create({ tenantId, keyHash, fingerprint, status: "processing", leaseToken: token,
      leaseUntil: new Date(Date.now() + LEASE_MS), actorId: actor.userId, apiKeyId: actor.apiKeyId,
      reportBindings: reportOptions.reportBindings, reportMetadataHash: reportOptions.reportMetadataHash });
  } catch (error) {
    if (error.code !== 11000) throw error;
    receipt = await Receipt.findOne({ tenantId, keyHash });
    if (!receipt || receipt.fingerprint !== fingerprint) throw new HttpError(409, "This idempotency key was already used for a different recipient, file or message");
    if (receipt.status === "erased") throw new HttpError(410, "This delivery was erased; the original request will not send again");
    const previous = await reconcile(receipt);
    if (previous) return previous;
    if (receipt.status === "queued") throw new HttpError(410, "The original delivery record is no longer available; it will not be sent again");
    receipt = await Receipt.findOneAndUpdate({ _id: receipt._id, fingerprint, $or: [
      { status: "failed" }, { status: "processing", leaseUntil: { $lt: new Date() } }
    ] }, { $set: { status: "processing", leaseToken: token, leaseUntil: new Date(Date.now() + LEASE_MS) } }, { returnDocument: "after" });
    if (!receipt) throw new HttpError(409, "This delivery is still processing. Retry the same request and key after a short wait");
  }
  try {
    const context = await messages.resolveTemplateSendContext(tenantId, payload, { skipMedia: true });
    if (context.template.mediaMode === "common") throw new HttpError(400, "This template is configured for Common Media; choose a Unique Media template for an individual file");
    if (!["image", "video", "document"].includes(context.template.headerType)) throw new HttpError(400, "Choose an approved template with an image, video or document header");
    const detected = libraryAsset || await media.detectMediaType(file.path);
    if (libraryAsset && require("./metaMedia.service").isMeta(libraryAsset)) require("./metaMedia.service").assertAvailable(libraryAsset, context.tenant);
    messages.assertSendMediaCompatible(libraryAsset || detected && { ...detected, bytes: file.size }, context.template.headerType);
    if (payload.purpose === "patient_report" && (detected.mediaType !== "document" || context.template.category !== "utility")) throw new HttpError(400, "Patient reports require a PDF and an approved utility template");
    if (payload.purpose === "patient_report" && !payload.consentReference) throw new HttpError(400, "Provide the client's permission reference for this report");
    const contact = await messages.resolveContact(tenantId, { phone: payload.to, name: payload.name, optIn: true,
      consentScope: payload.consentScope, optInProof: payload.consentReference || "Client delivery declaration: necessary permission obtained; evidence retained by client" });
    if (contact.status !== "active" || !contact.optIn?.status) throw new HttpError(403, "The recipient must be active and have the necessary recorded messaging permission");
    if (context.template.category === "marketing" && contact.optIn.scope === "service_only") throw new HttpError(400, "Service-only permission does not allow marketing messages");
    if (!messages.hasResolvedTemplateVariables(context.variables, contact)) throw new HttpError(400, "Required template variables are missing");
    const saved = await Receipt.updateOne({ _id: receipt._id, leaseToken: token, status: "processing" }, { $set: { contactId: contact._id } });
    if (!saved.matchedCount) throw new HttpError(409, "This delivery is being recovered; retry the same request");
    let asset = receipt.mediaId ? await Media.findOne({ tenantId, mediaId: receipt.mediaId }).select("+recipientHash").lean() : libraryAsset;
    if (receipt.mediaId && !asset) throw new HttpError(410, "This delivery's media was removed; use a new request key for a new delivery");
    if (asset?.deliveryScope === "unique" && !asset.recipientContactId) {
      if (asset.disabledAt || asset.accessExpiresAt && new Date(asset.accessExpiresAt) <= new Date()) throw new HttpError(410, "This media is no longer available");
      // Assign once, atomically: competing sends cannot move the file to another number.
      await Media.updateOne({ _id: asset._id, tenantId, deliveryScope: "unique", recipientContactId: null, disabledAt: null }, { $set: {
        deliveryScope: "recipient", recipientContactId: contact._id, recipientHash: media.recipientHash(tenantId, contact.phone),
        recipientVerifiedAt: new Date(), recipientVerifiedBy: actor.userId, recipientVerifiedByApiKey: actor.apiKeyId,
        consentReference: payload.consentReference, accessExpiresAt: new Date(Math.min(Date.now() + 30 * 86400000, asset.metaMediaExpiresAt ? new Date(asset.metaMediaExpiresAt).getTime() : Infinity))
      } });
      asset = await Media.findOne({ _id: asset._id, tenantId }).select("+recipientHash").lean();
      if (!asset) throw new HttpError(410, "This media is no longer available");
    }
    if (!asset) {
      const created = await media.createMedia(tenantId, file, { purpose: payload.purpose, deliveryScope: "recipient",
        recipientContactId: contact._id, recipientVerified: true, consentReference: payload.consentReference,
        title: `Recipient ${detected.mediaType}`, description: "" }, actor.userId, actor.apiKeyId);
      asset = await Media.findOne({ tenantId, mediaId: created.mediaId }).select("+recipientHash").lean();
      const attached = await Receipt.updateOne({ _id: receipt._id, leaseToken: token, status: "processing" }, { $set: { mediaId: asset.mediaId } });
      if (!attached.matchedCount) {
        await Media.updateOne({ _id: asset._id }, { $set: { disabledAt: new Date() } });
        throw new HttpError(409, "This delivery is being recovered; retry the same request");
      }
    }
    media.assertReportRecipient(asset, contact, context.template);
    if (!await Receipt.exists({ _id: receipt._id, leaseToken: token, status: "processing" })) throw new HttpError(409, "This delivery is being recovered; retry the same request");
    await Audit.create({ tenantId, actorId: actor.userId, apiKeyId: actor.apiKeyId, action: "media.delivery.queue", resourceId: String(receipt._id) });
    const queued = await messages.sendTemplateMessage(tenantId, { contactId: contact._id, templateName: context.templateName,
      language: context.language, variables: payload.variables, mediaId: asset.mediaId, idempotencyKey: `media-delivery:${receipt._id}` });
    await Receipt.updateOne({ _id: receipt._id, status: { $ne: "erased" } }, { $set: { status: "queued", messageId: queued.message._id,
      mediaId: queued.message.mediaId }, $unset: { leaseToken: "", leaseUntil: "" } });
    return result(receipt, queued.message, false);
  } catch (error) {
    const previous = await reconcile(receipt).catch(() => null);
    if (previous) return previous;
    await Receipt.updateOne({ _id: receipt._id, leaseToken: token, status: "processing" }, { $set: { status: "failed" }, $unset: { leaseToken: "", leaseUntil: "" } });
    throw error;
  }
}
module.exports = { sendMedia };
