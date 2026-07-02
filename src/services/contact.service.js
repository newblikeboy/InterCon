const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const ContactSegment = require("../models/ContactSegment");
const HttpError = require("../utils/httpError");

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

function normalizeContact(input) {
  const optInStatus = ["true", "yes", "1", true].includes(input.optIn || input.opt_in || input.consent);
  const optInAtRaw = input.optInAt || input.opt_in_at;

  return {
    name: String(input.name || input.customer_name || "").trim(),
    phone: normalizePhone(input.phone || input.mobile || input.whatsapp_number),
    email: input.email || "",
    city: input.city || "",
    source: input.source || "",
    tags: normalizeTags(input.tags),
    optIn: {
      status: optInStatus,
      proof: input.optInProof || input.opt_in_proof || input.proof || "",
      // Timestamp every attested opt-in for the business's audit trail: use the
      // provided date, otherwise default to now when opt-in is claimed.
      capturedAt: optInAtRaw ? new Date(optInAtRaw) : (optInStatus ? new Date() : undefined)
    }
  };
}

async function listContacts(tenantId, query = {}) {
  const filter = { tenantId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const search = String(query.search).trim();
    if (search.length > 100) throw new HttpError(400, "Search must be 100 characters or fewer");
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(escapedSearch, "i") },
      { phone: new RegExp(escapedSearch, "i") }
    ];
  }

  if (query.tag) {
    filter.tags = String(query.tag).trim();
  }

  const [contacts, segments] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
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

async function createContact(tenantId, body) {
  const contact = normalizeContact(body);

  if (!contact.name || !contact.phone) {
    throw new HttpError(400, "Contact name and phone are required");
  }
  assertValidWhatsappPhone(contact.phone);

  return Contact.findOneAndUpdate(
    { tenantId, phone: contact.phone },
    { $set: { ...contact, tenantId } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
}

async function importContacts(tenantId, contacts = []) {
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
      const contact = normalizeContact(row);
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
    await Contact.bulkWrite(operations, { ordered: false });
  }

  return results;
}

async function listOptOuts(tenantId) {
  return Contact.find({ tenantId, status: { $in: ["opted_out", "blocked"] } }).sort({ updatedAt: -1 }).limit(100).lean();
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

async function getSegmentMembers(tenantId, segmentId) {
  if (!mongoose.Types.ObjectId.isValid(segmentId)) {
    throw new HttpError(400, "Segment ID is invalid");
  }

  const segment = await ContactSegment.findOne({ _id: segmentId, tenantId }).lean();
  if (!segment) {
    throw new HttpError(404, "Group not found");
  }

  const members = await Contact.find({ tenantId, tags: segment.tag })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return { segment, members };
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
  listContacts,
  createContact,
  importContacts,
  listOptOuts,
  createSegment,
  listSegments,
  getSegmentMembers,
  setContactSegmentMembership,
  setContactGroup,
  deleteSegment
};
