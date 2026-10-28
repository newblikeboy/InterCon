const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const ContactSegment = require("../models/ContactSegment");
const HttpError = require("../utils/httpError");
const { cursorFilter, pageSize } = require("../utils/pagination");

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "").trim();

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  return digits;
}

function normalizeTags(tags) {
  const normalized = (Array.isArray(tags) ? tags : String(tags || "").split(","))
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  const latestTag = normalized.at(-1);
  return latestTag ? [latestTag] : [];
}

function assertValidWhatsappPhone(phone) {
  if (!/^\d{11,15}$/.test(phone)) {
    throw new HttpError(400, "WhatsApp number must include country code, for example 919210699076");
  }
}

function normalizeContact(input, actorId) {
  const consentScope = input.consentScope || input.consent_scope || "business_messages";
  if (!["business_messages", "service_only"].includes(consentScope)) throw new HttpError(400, "Choose a valid consent scope");
  const optInStatus = ["true", "yes", "1", true].includes(input.optIn || input.opt_in || input.consent);
  const optInAtRaw = input.optInAt || input.opt_in_at;
  const capturedAt = optInAtRaw ? new Date(optInAtRaw) : (optInStatus ? new Date() : undefined);
  if (capturedAt && (!Number.isFinite(capturedAt.getTime()) || capturedAt.getTime() > Date.now() + 300000)) throw new HttpError(400, "Consent date must be valid and cannot be in the future");

  return {
    name: String(input.name || input.customer_name || "").trim(),
    phone: normalizePhone(input.phone || input.mobile || input.whatsapp_number),
    email: input.email || "",
    city: input.city || "",
    source: input.source || "",
    tags: normalizeTags(input.tags),
    optIn: {
      status: optInStatus,
      proof: input.optInProof || input.opt_in_proof || input.proof || (optInStatus ? "Client declaration: permission obtained; underlying evidence retained by the client" : ""),
      purpose: input.consentPurpose || "WhatsApp business messages requested by the client",
      noticeVersion: input.consentNoticeVersion || "",
      recordedBy: actorId,
      scope: consentScope,
      // Timestamp every attested opt-in for the business's audit trail: use the
      // provided date, otherwise default to now when opt-in is claimed.
      capturedAt
    }
  };
}

async function listContacts(tenantId, query = {}) {
  const filter = { tenantId, ...cursorFilter(query.after) };

  if (query.status) {
    filter.status = query.status;
  }

  const search = String(query.search || "").trim().toLowerCase();
  if (search.length > 100) throw new HttpError(400, "Search must be 100 characters or fewer");
  if (search) Object.assign(filter, Contact.privateSearchFilter(search));

  if (query.tag) {
    filter.tags = String(query.tag).trim();
  }

  async function findContacts() {
    const limit = pageSize(query.limit);
    if (!search) return Contact.find(filter).sort({ _id: -1 }).limit(limit).lean();
    const matches = [];
    let after = query.after;
    while (matches.length < limit) {
      const batch = await Contact.find({ ...filter, ...cursorFilter(after) }).sort({ _id: -1 }).limit(200).lean();
      if (!batch.length) break;
      for (const contact of batch) {
        if (contact.name.toLowerCase().includes(search) || contact.phone.toLowerCase().includes(search)) matches.push(contact);
        if (matches.length === limit) break;
      }
      if (batch.length < 200) break;
      after = String(batch.at(-1)._id);
    }
    return matches;
  }
  const [contacts, segments] = await Promise.all([
    findContacts(),
    ContactSegment.find({ tenantId }).select("_id name tag").lean()
  ]);
  const groupByTag = new Map(
    segments
      .filter((segment) => segment.tag)
      .map((segment) => [segment.tag, {
        id: String(segment._id),
        name: segment.name,
        tag: segment.tag
      }])
  );

  return contacts.map((contact) => ({
    ...contact,
    group: groupByTag.get(contact.tags?.[0]) || null
  }));
}

async function createContact(tenantId, body, actorId) {
  const contact = normalizeContact(body, actorId);

  if (!contact.name || !contact.phone) {
    throw new HttpError(400, "Contact name and phone are required");
  }
  assertValidWhatsappPhone(contact.phone);
  if (await require("../models/SuppressionEntry").exists({ tenantId, recipientHash: require("./privacy.service").suppressionHash(tenantId, contact.phone) })) throw new HttpError(409, "This recipient was erased. Record fresh verified consent through the privacy workflow before adding them again");

  return Contact.findOneAndUpdate(
    { tenantId, phone: contact.phone },
    { $set: { ...contact, tenantId } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
}

async function updateContact(tenantId, contactId, body = {}, actorId) {
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new HttpError(400, "Contact ID is invalid");
  }

  const contact = normalizeContact(body, actorId);
  if (!contact.name || !contact.phone) {
    throw new HttpError(400, "Contact name and phone are required");
  }
  assertValidWhatsappPhone(contact.phone);

  const status = String(body.status || "active").trim();
  if (!["active", "opted_out", "blocked"].includes(status)) {
    throw new HttpError(400, "Contact status is invalid");
  }

  const current = await Contact.findOne({ _id: contactId, tenantId }).lean();
  if (!current) throw new HttpError(404, "Contact not found");
  if (current.status !== "active" && contact.phone !== current.phone) throw new HttpError(400, "Restore this contact with fresh consent before changing its blacklisted or opted-out number.");
  const explicitProof = String(body.optInProof || body.opt_in_proof || body.proof || "").trim();
  if (current.status !== "active" && status === "active" && (!contact.optIn.status || !explicitProof)) throw new HttpError(400, "To restore this contact, confirm fresh consent and enter its evidence.");
  const existing = await Contact.findOne({
    tenantId,
    phone: contact.phone,
    _id: { $ne: contactId }
  }).select("_id").lean();
  if (existing) {
    throw new HttpError(409, "Another contact already uses this WhatsApp number");
  }

  const session = await mongoose.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const update = { $set: { ...contact, status } };
      if (current.status !== status) {
        if (status === "active") {
          update.$unset = { suppression: 1 };
          update.$set.suppressionClearedAt = new Date();
        } else {
          update.$set.suppression = {
            kind: status === "opted_out" ? "opt_out" : "manual",
            reason: contact.optIn.proof || "Contact status changed in contact editor",
            recordedAt: new Date()
          };
        }
      }
      updated = await Contact.findOneAndUpdate({ _id: contactId, tenantId, status: current.status }, update,
        { returnDocument: "after", runValidators: true, session });
      if (!updated) throw new HttpError(409, "This contact changed while you were editing. Reload it and try again.");
      if (current.status !== status) await require("../models/ContactStatusEvent").create([{
        tenantId, contactId, actorId, previousStatus: current.status, status,
        reason: contact.optIn.proof || "Contact status changed in contact editor"
      }], { session });
    });
  } finally { await session.endSession(); }

  return updated;
}

async function importContacts(tenantId, contacts = [], actorId) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    throw new HttpError(400, "At least one contact is required");
  }

  const MAX_IMPORT = 1000;
  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  // Surface rows dropped by the per-upload cap instead of silently discarding them.
  if (contacts.length > MAX_IMPORT) {
    const dropped = contacts.length - MAX_IMPORT;
    results.skipped += dropped;
    results.errors.push(`${dropped} row(s) beyond the ${MAX_IMPORT}-contact per-upload limit were not imported. Split the file and upload again.`);
  }

  const operations = [];

  for (const row of contacts.slice(0, MAX_IMPORT)) {
    try {
      const contact = normalizeContact(row, actorId);
      if (!contact.name || !contact.phone) {
        throw new HttpError(400, "Contact name and phone are required");
      }
      assertValidWhatsappPhone(contact.phone);

      operations.push({
        updateOne: {
          filter: { tenantId, phone: contact.phone },
          update: {
            $set: { ...contact, tenantId },
            $setOnInsert: { status: "active" }
          },
          upsert: true
        }
      });
      results.imported += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push(error.message);
    }
  }

  if (operations.length) {
    const hashes = operations.map(operation => require("./privacy.service").suppressionHash(tenantId, operation.updateOne.filter.phone));
    const suppressed = new Set((await require("../models/SuppressionEntry").find({ tenantId, recipientHash: { $in: hashes } }).select("recipientHash").lean()).map(row => row.recipientHash));
    for (let index = operations.length - 1; index >= 0; index--) if (suppressed.has(hashes[index])) {
      operations.splice(index, 1); results.imported--; results.skipped++; results.errors.push("A previously erased recipient was not imported; fresh verified consent is required.");
    }
    await Contact.bulkWrite(operations, { ordered: false });
  }

  return results;
}

async function suppressContact(tenantId, body = {}, actorId) {
  const phone = normalizePhone(body.phone);
  assertValidWhatsappPhone(phone);
  const status = String(body.status || "blocked");
  if (!["blocked", "opted_out"].includes(status)) throw new HttpError(400, "Choose blocked or opted out");
  const reason = String(body.reason || "").trim();
  if (!reason || reason.length > 1000) throw new HttpError(400, "Enter a reason of 1 to 1000 characters");
  const kind = status === "opted_out" ? "opt_out" : String(body.kind || "manual");
  if (status === "blocked" && !["manual", "customer_block"].includes(kind)) throw new HttpError(400, "Choose a manual block or a customer-reported block");
  const session = await mongoose.startSession();
  let contact;
  try {
    await session.withTransaction(async () => {
      contact = await Contact.findOne({ tenantId, phone }).session(session);
      const previousStatus = contact?.status || "active";
      if (!contact) contact = new Contact({ tenantId, phone, name: phone, source: "manual_suppression" });
      contact.status = status;
      contact.suppression = { kind, reason, recordedAt: new Date() };
      contact.optIn = { status: false, proof: reason.slice(0, 240), capturedAt: new Date() };
      await contact.save({ session });
      await require("../models/ContactStatusEvent").create([{ tenantId, contactId: contact._id, actorId, previousStatus, status, reason }], { session });
    });
    return contact;
  } finally { await session.endSession(); }
}

// 131026 says the recipient cannot receive this message; it does not confirm
// that they blocked the business. Suppress future sends without asserting that.
async function suppressUndeliverableContact(tenantId, phone, error = {}, { metaMessageId, sentAt } = {}) {
  if (Number(error?.code) !== 131026) return null;
  phone = normalizePhone(phone);
  assertValidWhatsappPhone(phone);
  const reason = ["WhatsApp could not deliver (131026). Possible block or unavailable WhatsApp account.",
    error.error_data?.details || error.title || error.message].filter(Boolean).join(" ").slice(0, 1000);
  const session = await mongoose.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      result = null;
      let contact = await Contact.findOne({ tenantId, phone }).session(session);
      // Preserve manual blocks/opt-outs and make duplicate webhook events harmless.
      if (contact && contact.status !== "active") return;
      // A delayed failure from a send before fresh consent cannot undo restoration.
      if (contact?.suppressionClearedAt && (!sentAt || new Date(sentAt) <= contact.suppressionClearedAt)) return;
      if (!contact) contact = new Contact({ tenantId, phone, name: phone, source: "whatsapp_delivery_failure" });
      contact.status = "blocked";
      contact.suppression = { kind: "delivery_failure", reason, recordedAt: new Date(), errorCode: 131026, metaMessageId };
      contact.optIn = { status: false, proof: reason.slice(0, 240), capturedAt: new Date() };
      await contact.save({ session });
      await require("../models/ContactStatusEvent").create([{
        tenantId, contactId: contact._id, previousStatus: "active", status: "blocked", reason
      }], { session });
      result = contact;
    });
    return result;
  } finally { await session.endSession(); }
}

async function listOptOuts(tenantId, query = {}) {
  return Contact.find({ tenantId, status: { $in: ["opted_out", "blocked"] }, ...cursorFilter(query.after) }).sort({ _id: -1 }).limit(pageSize(query.limit)).lean();
}

async function createSegment(tenantId, body) {
  const name = String(body.name || "").trim();
  const tag = String(body.tag || "").trim();

  if (!name || !tag) {
    throw new HttpError(400, "Segment name and tag are required");
  }

  return ContactSegment.findOneAndUpdate(
    { tenantId, name },
    {
      $set: {
        tenantId,
        name,
        tag,
        description: body.description || ""
      }
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
}

async function listSegments(tenantId) {
  const [segments, tagCounts] = await Promise.all([
    ContactSegment.find({ tenantId }).sort({ createdAt: -1 }).limit(500).lean(),
    Contact.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)), status: "active" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } }
    ])
  ]);
  const countByTag = new Map(tagCounts.map((item) => [item._id, item.count]));

  return segments.map((segment) => ({
    ...segment,
    memberCount: countByTag.get(segment.tag) || 0
  }));
}

async function getSegmentMembers(tenantId, segmentId, query = {}) {
  if (!mongoose.Types.ObjectId.isValid(segmentId)) {
    throw new HttpError(400, "Segment ID is invalid");
  }

  const segment = await ContactSegment.findOne({ _id: segmentId, tenantId }).lean();
  if (!segment) {
    throw new HttpError(404, "Group not found");
  }

  const members = await Contact.find({ tenantId, tags: segment.tag, ...cursorFilter(query.after) })
    .sort({ _id: -1 })
    .limit(pageSize(query.limit, 500))
    .lean();

  return { segment, members, nextCursor: members.length === pageSize(query.limit, 500) ? String(members.at(-1)._id) : null };
}

async function setContactSegmentMembership(tenantId, segmentId, contactId, attach) {
  if (!mongoose.Types.ObjectId.isValid(segmentId)) {
    throw new HttpError(400, "Segment ID is invalid");
  }
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new HttpError(400, "Contact ID is invalid");
  }

  const segment = await ContactSegment.findOne({ _id: segmentId, tenantId }).lean();
  if (!segment) {
    throw new HttpError(404, "Group not found");
  }

  if (attach) {
    const data = await setContactGroup(tenantId, contactId, segmentId);
    return {
      contact: data.contact,
      segmentId,
      attached: true
    };
  }

  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, tenantId },
    { $pull: { tags: segment.tag } },
    { returnDocument: "after" }
  ).lean();

  if (!contact) {
    throw new HttpError(404, "Contact not found");
  }

  return { contact, segmentId, attached: attach };
}

async function setContactGroup(tenantId, contactId, segmentId) {
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new HttpError(400, "Contact ID is invalid");
  }
  if (segmentId && !mongoose.Types.ObjectId.isValid(segmentId)) {
    throw new HttpError(400, "Group ID is invalid");
  }

  const segments = await ContactSegment.find({ tenantId })
    .select("_id name tag")
    .lean();
  const selectedSegment = segmentId
    ? segments.find((segment) => String(segment._id) === String(segmentId))
    : null;

  if (segmentId && !selectedSegment) {
    throw new HttpError(404, "Group not found");
  }

  const contact = await Contact.findOne({ _id: contactId, tenantId });
  if (!contact) {
    throw new HttpError(404, "Contact not found");
  }

  // Group tags use the contact's single tag slot. A new selection fully
  // replaces the previous tag; choosing no group clears it.
  contact.tags = selectedSegment?.tag ? [selectedSegment.tag] : [];
  await contact.save();

  return {
    contact: contact.toObject(),
    group: selectedSegment
      ? {
          id: String(selectedSegment._id),
          name: selectedSegment.name,
          tag: selectedSegment.tag
        }
      : null
  };
}

async function deleteSegment(tenantId, segmentId) {
  if (!mongoose.Types.ObjectId.isValid(segmentId)) {
    throw new HttpError(400, "Segment ID is invalid");
  }

  const segment = await ContactSegment.findOneAndDelete({ _id: segmentId, tenantId });
  if (!segment) {
    throw new HttpError(404, "Group not found");
  }

  // Deleting a group only removes the segment definition; contacts and their
  // tags are left untouched so no customer data is lost.
  return { id: segmentId };
}

module.exports = {
  suppressUndeliverableContact,
  suppressContact,
  listContacts,
  createContact,
  updateContact,
  importContacts,
  listOptOuts,
  createSegment,
  listSegments,
  getSegmentMembers,
  setContactSegmentMembership,
  setContactGroup,
  deleteSegment
};
