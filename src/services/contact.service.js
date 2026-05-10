const Contact = require("../models/Contact");
const ContactSegment = require("../models/ContactSegment");
const HttpError = require("../utils/httpError");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
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

  return Contact.find(filter).sort({ createdAt: -1 }).limit(100);
}

async function createContact(tenantId, body) {
  const contact = normalizeContact(body);

  if (!contact.name || !contact.phone) {
    throw new HttpError(400, "Contact name and phone are required");
  }

  return Contact.findOneAndUpdate(
    { tenantId, phone: contact.phone },
    { $set: { ...contact, tenantId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
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

  for (const row of contacts.slice(0, 1000)) {
    try {
      await createContact(tenantId, row);
      results.imported += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push(error.message);
    }
  }

  return results;
}

async function listOptOuts(tenantId) {
  return Contact.find({ tenantId, status: { $in: ["opted_out", "blocked"] } }).sort({ updatedAt: -1 }).limit(100);
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
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function listSegments(tenantId) {
  return ContactSegment.find({ tenantId }).sort({ createdAt: -1 });
}

module.exports = {
  listContacts,
  createContact,
  importContacts,
  listOptOuts,
  createSegment,
  listSegments
};
