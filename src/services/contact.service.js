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
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function assertValidWhatsappPhone(phone) {
  if (!/^\d{11,15}$/.test(phone)) {
    throw new HttpError(400, "WhatsApp number must include country code, for example 919210699076");
  }
}

function normalizeContact(input) {
  return {
    name: String(input.name || input.customer_name || "").trim(),
    phone: normalizePhone(input.phone || input.mobile || input.whatsapp_number),
    email: input.email || "",
    city: input.city || "",
    source: input.source || "",
    tags: normalizeTags(input.tags),
    optIn: {
      status: ["true", "yes", "1", true].includes(input.optIn || input.opt_in || input.consent),
      proof: input.optInProof || input.opt_in_proof || input.proof || "",
      capturedAt: input.optInAt || input.opt_in_at ? new Date(input.optInAt || input.opt_in_at) : undefined
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
    filter.$or = [
      { name: new RegExp(search, "i") },
      { phone: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    ];
  }

  if (query.tag) {
    filter.tags = String(query.tag).trim();
  }

  return Contact.find(filter).sort({ createdAt: -1 }).limit(100).lean();
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

  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  const operations = [];

  for (const row of contacts.slice(0, 1000)) {
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
  const segments = await ContactSegment.find({ tenantId }).sort({ createdAt: -1 }).lean();

  // Group membership is defined by the contact carrying the segment's tag.
  const counts = await Promise.all(
    segments.map((segment) =>
      Contact.countDocuments({ tenantId, tags: segment.tag, status: "active" })
    )
  );

  return segments.map((segment, index) => ({
    ...segment,
    memberCount: counts[index]
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

  const update = attach
    ? { $addToSet: { tags: segment.tag } }
    : { $pull: { tags: segment.tag } };

  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, tenantId },
    update,
    { returnDocument: "after" }
  ).lean();

  if (!contact) {
    throw new HttpError(404, "Contact not found");
  }

  return { contact, segmentId, attached: attach };
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
  deleteSegment
};
