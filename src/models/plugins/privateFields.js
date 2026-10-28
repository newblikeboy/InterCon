const mongoose = require("mongoose");
const HttpError = require("../../utils/httpError");
const { encrypt, decrypt, lookup, HASH_PREFIX } = require("../../utils/privateData");

// Model-bound encryption keeps ordinary document/lean reads usable by the
// existing tenant-authorized services. Exact-match fields retain their current
// indexes: they store an HMAC, with randomized ciphertext in a hidden companion.
// Raw collection access intentionally bypasses this layer (migration/inspection).
module.exports = function privateFields(schema, { namespace, fields }) {
  function read(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); }
  function write(object, path, value) {
    const parts = path.split("."); const last = parts.pop();
    const target = parts.reduce((current, key) => current[key] ||= {}, object);
    target[last] = value;
  }
  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
    return value; // Keep BSON ObjectIds, dates and regular expressions intact.
  }
  const entries = Object.entries(fields).map(([path, options]) => ({
    path, ...options, context: `${namespace}.${path}`, companion: `__private_${path.replaceAll(".", "_")}`,
    searchPath: `__private_search_${path.replaceAll(".", "_")}`
  }));

  function searchTokens(entry, value) {
    const text = String(value || "").toLowerCase();
    return [...new Set(Array.from({ length: Math.max(0, text.length - 2) }, (_, i) =>
      lookup(text.slice(i, i + 3), `${entry.context}.search`)))];
  }

  function plainValue(entry, value, record) {
    if (entry.lookup && typeof value === "string" && value.startsWith(HASH_PREFIX)) {
      const ciphertext = record?.get ? record.get(entry.companion) : record?.[entry.companion];
      if (!ciphertext) throw new Error("Customer data ciphertext was not selected");
      return decrypt(ciphertext, entry.context);
    }
    return decrypt(value, entry.context);
  }

  function normalize(entry, value) {
    if (value === undefined || value === null) return value;
    if (entry.normalize) value = entry.normalize(value);
    if (entry.json) return value;
    let text = String(value);
    if (entry.trim !== false) text = text.trim();
    if (entry.lowercase) text = text.toLowerCase();
    if (entry.max && text.length > entry.max) throw new HttpError(400, `${entry.path} exceeds its maximum length`);
    return text;
  }

  function protect(entry, value) {
    const plain = normalize(entry, decrypt(value, entry.context));
    return entry.lookup && plain != null && plain !== ""
      ? { value: lookup(plain, entry.context), ciphertext: encrypt(plain, entry.context), plain }
      : { value: encrypt(plain, entry.context), plain };
  }

  for (const entry of entries) {
    const path = schema.path(entry.path);
    if (!path) throw new Error(`Unknown private field ${entry.context}`);
    // Native string trim/lowercase/length validation would operate on ciphertext.
    // Normalize and validate plaintext before encrypting instead.
    path.setters = [];
    path.validators = path.validators.filter(v => !["maxlength", "minlength"].includes(v.type));
    if (entry.lookup) schema.add({ [entry.companion]: { type: String, select: false } });
    if (entry.search) schema.add({ [entry.searchPath]: { type: [String], select: false, default: undefined } });
    if (entry.search) schema.index({ tenantId: 1, [entry.searchPath]: 1 });
    path.set(function(value) {
      if (!(this instanceof mongoose.Document)) return value; // Query writes are handled below.
      if (entry.lookup && typeof value === "string" && value.startsWith(HASH_PREFIX)) return value;
      const protectedValue = protect(entry, value);
      if (entry.json) {
        const cache = this.$locals.privateDecoded ||= {};
        cache[entry.path] = { stored: protectedValue.value, value: protectedValue.plain };
      }
      if (entry.lookup) this.set(entry.companion, protectedValue.ciphertext);
      if (entry.search) this.set(entry.searchPath, searchTokens(entry, plainValue(entry, protectedValue.value, this)));
      return protectedValue.value;
    });
    path.get(function(value) {
      if (!entry.json) return plainValue(entry, value, this);
      const cache = this.$locals.privateDecoded ||= {};
      if (cache[entry.path] && cache[entry.path].stored === value) return cache[entry.path].value;
      const plain = plainValue(entry, value, this);
      cache[entry.path] = { stored: value, value: plain };
      return plain;
    });
  }

  schema.pre("save", function() {
    for (const entry of entries.filter(item => item.json)) {
      const cached = this.$locals.privateDecoded?.[entry.path];
      if (cached && this.isModified(entry.path) && cached.stored === this.$__getValue(entry.path)) this.set(entry.path, cached.value);
    }
  });

  function reveal(record) {
    if (!record || typeof record !== "object") return record;
    for (const entry of entries) {
      if (read(record, entry.path) !== undefined) write(record, entry.path, plainValue(entry, read(record, entry.path), record));
      delete record[entry.companion];
      delete record[entry.searchPath];
    }
    return record;
  }

  for (const option of ["toJSON", "toObject"]) {
    const previous = schema.get(option) || {};
    const transform = previous.transform;
    schema.set(option, { ...previous, getters: true, transform(doc, result, options) {
      for (const entry of entries) { delete result[entry.companion]; delete result[entry.searchPath]; }
      return transform ? transform(doc, result, options) : result;
    } });
  }

  function equality(entry, condition) {
    const values = value => {
      if (value == null || typeof value === "string" && value.startsWith(HASH_PREFIX)) return [value];
      const plain = normalize(entry, value);
      return [lookup(plain, entry.context), plain]; // Compatibility with pre-migration rows.
    };
    if (condition instanceof RegExp) throw new Error(`Use decrypted search for ${entry.context}`);
    if (condition && typeof condition === "object") {
      const result = {};
      for (const [operator, value] of Object.entries(condition)) {
        if (operator === "$eq") result.$in = values(value);
        else if (operator === "$ne") result.$nin = values(value);
        else if (["$in", "$nin"].includes(operator)) result[operator] = value.flatMap(values);
        else if (["$exists", "$type"].includes(operator)) result[operator] = value;
        else throw new Error(`Unsupported private-field query on ${entry.context}`);
      }
      return result;
    }
    return condition == null ? condition : { $in: values(condition) };
  }

  function filter(query) {
    if (!query || typeof query !== "object") return query;
    for (const operator of ["$and", "$or", "$nor"]) {
      if (query[operator]) query[operator].forEach(filter);
    }
    for (const entry of entries) {
      if (Object.hasOwn(query, entry.path)) {
        if (!entry.lookup) throw new Error(`Filtering encrypted ${entry.context} requires decrypted search`);
        query[entry.path] = equality(entry, query[entry.path]);
      }
    }
    return query;
  }

  function update(document, originalFilter = {}, upsert = false) {
    if (Array.isArray(document)) throw new Error("Pipeline updates are not supported for encrypted models");
    if (!document) return document;
    if (upsert) {
      for (const entry of entries.filter(item => item.lookup)) {
        const value = originalFilter[entry.path];
        if (typeof value === "string" && !value.startsWith(HASH_PREFIX)
          && !Object.hasOwn(document.$set || document, entry.path)
          && !Object.hasOwn(document.$setOnInsert || {}, entry.path)) {
          (document.$setOnInsert ||= {})[entry.path] = value;
        }
      }
    }
    const containers = Object.keys(document).some(key => key.startsWith("$"))
      ? [document.$set, document.$setOnInsert].filter(Boolean) : [document];
    for (const container of containers) {
      for (const entry of entries) {
        const direct = Object.hasOwn(container, entry.path);
        const value = direct ? container[entry.path] : read(container, entry.path);
        if (value === undefined) continue;
        if (entry.lookup && typeof value === "string" && value.startsWith(HASH_PREFIX)) {
          if (!container[entry.companion]) throw new Error("A private lookup cannot be written without its ciphertext");
          const plain = decrypt(container[entry.companion], entry.context);
          if (lookup(plain, entry.context) !== value) throw new Error("Private lookup and ciphertext do not match");
        } else {
          const protectedValue = protect(entry, value);
          if (direct) container[entry.path] = protectedValue.value;
          else write(container, entry.path, protectedValue.value);
          if (entry.lookup) container[entry.companion] = protectedValue.ciphertext;
        }
        if (entry.search) container[entry.searchPath] = searchTokens(entry, plainValue(entry, container[entry.path], container));
      }
    }
    for (const entry of entries) {
      if (Object.hasOwn(document.$unset || {}, entry.path) && entry.lookup) document.$unset[entry.companion] = 1;
      if (Object.hasOwn(document.$unset || {}, entry.path) && entry.search) document.$unset[entry.searchPath] = 1;
      for (const [operator, container] of Object.entries(document)) {
        if (!operator.startsWith("$") || !container || typeof container !== "object") continue;
        for (const path of Object.keys(container)) {
          if (path.startsWith(entry.path + ".") || path === entry.path && !["$set", "$setOnInsert", "$unset"].includes(operator)) {
            throw new Error(`Replace the complete encrypted ${entry.context} field`);
          }
        }
      }
    }
    return document;
  }

  schema.pre(["find", "findOne", "findOneAndUpdate", "findOneAndDelete", "deleteOne", "deleteMany", "countDocuments", "updateOne", "updateMany", "replaceOne", "findOneAndReplace"], function() {
    const original = copy(this.getFilter());
    const write = copy(this.getUpdate());
    if (write) this.setUpdate(update(write, original, this.getOptions().upsert));
    this.setQuery(filter(copy(original)));
    if (["find", "findOne", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"].includes(this.op)) {
      const projection = this.projection() || {};
      const inclusive = Object.entries(projection).some(([key, value]) => value === 1 && key !== "_id");
      for (const entry of entries.filter(item => item.lookup)) {
        if (projection[entry.path] === 0 || inclusive && !projection[entry.path]) continue;
        this.select(`+${entry.companion}`);
      }
    }
  });
  schema.post(["find", "findOne", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"], function(result) {
    if (this.mongooseOptions().lean) {
      if (Array.isArray(result)) result.forEach(reveal);
      else reveal(result);
    }
  });
  schema.pre("bulkWrite", function(operations) {
    for (let index = 0; index < operations.length; index++) {
      // Providers may reuse one update object across Message and InboxMessage.
      // Never overwrite their shared plaintext input with model-bound ciphertext.
      const operation = operations[index] = copy(operations[index]);
      const kind = Object.keys(operation)[0], value = operation[kind];
      if (["updateOne", "updateMany", "replaceOne"].includes(kind)) {
        const original = { ...value.filter };
        if (kind === "replaceOne") update(value.replacement);
        else update(value.update, original, value.upsert);
        filter(value.filter);
      } else if (["deleteOne", "deleteMany"].includes(kind)) filter(value.filter);
      // insertOne/insertMany are cast through document setters by Mongoose.
    }
  });
  schema.pre("insertMany", function(documents) {
    for (let index = 0; index < documents.length; index++) {
      const document = documents[index] instanceof mongoose.Document
        ? documents[index].toObject({ getters: false, transform: false }) : copy(documents[index]);
      documents[index] = update(document);
    }
  });

  schema.pre("aggregate", function() {
    for (const stage of this.pipeline()) {
      if (stage.$match) filter(stage.$match);
      if (stage.$project) {
        for (const entry of entries.filter(item => item.lookup)) {
          if (stage.$project[entry.path] === 1) stage.$project[entry.companion] = 1;
        }
      }
    }
  });
  schema.post("aggregate", function(result) { if (Array.isArray(result)) result.forEach(reveal); });
  schema.statics.revealPrivateFields = reveal;
  schema.statics.privateStorageUpdate = update;
  schema.statics.privateFieldDefinitions = entries;
  schema.statics.readPrivateStoragePath = read;
  schema.statics.privateSearchFilter = function(search) {
    // Short queries scan candidates and are checked on decrypted values. Longer
    // queries use keyed trigrams, then an exact substring check in the service.
    if (search.length < 3) return {};
    return { $or: entries.filter(entry => entry.search).flatMap(entry => [
      { [entry.searchPath]: { $all: searchTokens(entry, search) } },
      { [entry.searchPath]: { $exists: false } } // Legacy rows before migration.
    ]) };
  };
};
