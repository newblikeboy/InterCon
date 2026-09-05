const fs = require("fs");
const path = require("path");
function models() {
  return fs.readdirSync(path.join(__dirname, "../models")).filter(file => file.endsWith(".js"))
    .map(file => require(path.join(__dirname, "../models", file)));
}
function canonical(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonical);
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
}
function sameOptions(existing, options) {
  return ["unique", "sparse", "partialFilterExpression", "expireAfterSeconds"].every(key => {
    const fallback = ["unique", "sparse"].includes(key) ? false : null;
    return JSON.stringify(canonical(existing[key] ?? fallback)) === JSON.stringify(canonical(options[key] ?? fallback));
  });
}
async function assertNoDuplicates(model, key, options) {
  if (!options.unique) return;
  const stages = [];
  if (options.partialFilterExpression) stages.push({ $match: options.partialFilterExpression });
  else if (options.sparse) stages.push({ $match: { $or: Object.keys(key).map(field => ({ [field]: { $exists: true } })) } });
  const group = Object.fromEntries(Object.keys(key).map((field, i) => [`field${i}`, `$${field}`]));
  const duplicates = await model.aggregate([...stages, { $group: { _id: group, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $limit: 1 }]);
  if (duplicates.length) throw new Error(`Duplicate records prevent index ${model.modelName}(${Object.keys(key).join(", ")}). Resolve duplicates before migration; no records were deleted.`);
}
async function ensureCriticalIndexes() {
  const entries = models().flatMap(model => {
    const indexes = new Map();
    for (const [key, options] of model.schema.indexes()) {
      const id = JSON.stringify(key);
      indexes.set(id, { model, key, options: { ...(indexes.get(id)?.options || {}), ...options } });
    }
    return [...indexes.values()];
  });
  for (const { model, key, options } of entries) await assertNoDuplicates(model, key, options);
  for (const { model, key, options } of entries) {
    let existing = [];
    try { existing = await model.collection.indexes(); }
    catch (error) { if (error.code !== 26 && error.codeName !== "NamespaceNotFound") throw error; }
    const match = existing.find(index => JSON.stringify(index.key) === JSON.stringify(key));
    if (match && sameOptions(match, options)) continue;
    if (match) throw new Error(`Index options differ for ${model.modelName}.${match.name}. Review and migrate this index explicitly before startup.`);
    try { await model.collection.createIndex(key, options); }
    catch (error) {
      const indexes = await model.collection.indexes();
      if (!indexes.some(index => JSON.stringify(index.key) === JSON.stringify(key) && sameOptions(index, options))) throw error;
    }
  }
}
module.exports = { ensureCriticalIndexes };
