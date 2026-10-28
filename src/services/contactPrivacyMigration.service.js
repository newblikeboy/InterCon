const { isEncrypted, decrypt, lookup, HASH_PREFIX } = require("../utils/privateData");

function protectedModels() {
  return ["Contact", "Conversation", "InboxMessage", "Message", "RecipientUsage", "WebhookEvent", "MessageBatch", "AutomationExecution", "ContactStatusEvent"]
    .concat(["MediaAsset", "PrivacyRequest"]).map(name => require(`../models/${name}`));
}

async function migrateCustomerData({ apply = false, models = protectedModels() } = {}) {
  const summary = [];
  for (const model of models) {
    const result = { model: model.modelName, scanned: 0, pending: 0, migrated: 0, conflicts: 0 };
    const cursor = model.collection.find({}).batchSize(100);
    try {
      for await (const raw of cursor) {
        result.scanned++;
        const values = {}, compare = { _id: raw._id };
        for (const entry of model.privateFieldDefinitions) {
          const value = model.readPrivateStoragePath(raw, entry.path);
          if (value === undefined || value === null || value === "") continue;
          const hashed = entry.lookup && typeof value === "string" && value.startsWith(HASH_PREFIX);
          const encrypted = isEncrypted(value);
          // Validate already-protected data too, so a wrong key never produces
          // a successful-looking migration. Do not rewrite it unnecessarily.
          if (hashed) {
            if (!isEncrypted(raw[entry.companion])) throw new Error(`Missing ciphertext in ${model.modelName}`);
            if (lookup(decrypt(raw[entry.companion], entry.context), entry.context) !== value) throw new Error(`Invalid lookup in ${model.modelName}`);
          } else if (encrypted) decrypt(value, entry.context);
          if ((!entry.lookup && encrypted || hashed) && (!entry.search || Array.isArray(raw[entry.searchPath]))) continue;
          values[entry.path] = value;
          compare[entry.path] = value;
          if (hashed) {
            values[entry.companion] = raw[entry.companion];
            compare[entry.companion] = raw[entry.companion];
          }
        }
        if (!Object.keys(values).length) continue;
        result.pending++;
        const update = model.privateStorageUpdate({ $set: values });
        if (apply) {
          // Preserve concurrent edits. A conflicted row is retried on the next run.
          const written = await model.collection.updateOne(compare, update);
          if (written.matchedCount) result.migrated++;
          else result.conflicts++;
        }
      }
    } finally { await cursor.close(); }
    summary.push(result);
  }
  return summary;
}

async function migrateTrialRecipientData({ apply = false } = {}) {
  const Tenant = require("../models/Tenant");
  const result = { model: "Tenant.trial", scanned: 0, pending: 0, migrated: 0, conflicts: 0 };
  const cursor = Tenant.collection.find({}, { projection: { trial: 1 } }).batchSize(100);
  try {
    for await (const raw of cursor) {
      result.scanned++;
      const values = {}, compare = { _id: raw._id };
      if (raw.trial?.recipients?.some(value => value && !value.startsWith(HASH_PREFIX))) {
        compare["trial.recipients"] = raw.trial.recipients;
        values["trial.recipients"] = raw.trial.recipients.map(value => value ? lookup(value, "Tenant.trial.recipient") : value);
      }
      if (raw.trial?.reservations?.some(item => item.recipient && !item.recipient.startsWith(HASH_PREFIX))) {
        compare["trial.reservations"] = raw.trial.reservations;
        values["trial.reservations"] = raw.trial.reservations.map(item => ({ ...item,
          recipient: item.recipient ? lookup(item.recipient, "Tenant.trial.recipient") : item.recipient }));
      }
      if (!Object.keys(values).length) continue;
      result.pending++;
      if (apply) {
        const written = await Tenant.collection.updateOne(compare, { $set: values });
        if (written.matchedCount) result.migrated++;
        else result.conflicts++;
      }
    }
  } finally { await cursor.close(); }
  return result;
}

module.exports = { migrateCustomerData, migrateTrialRecipientData };
