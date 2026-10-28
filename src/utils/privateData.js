const crypto = require("crypto");
const env = require("../config/env");

const PREFIX = "private:v1:";
const HASH_PREFIX = "lookup:v1:";

function key(purpose) {
  if (!env.dataEncryptionKey || env.dataEncryptionKey.length < 32) {
    throw new Error("A stable DATA_ENCRYPTION_KEY of at least 32 characters is required for customer data protection");
  }
  return crypto.createHmac("sha256", env.dataEncryptionKey).update(`intercon:private-data:v1:${purpose}`).digest();
}

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

function encrypt(value, context) {
  if (value === undefined || value === null || value === "") return value;
  if (isEncrypted(value)) {
    decrypt(value, context); // Never accept an unchecked ciphertext envelope.
    return value;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key("encryption"), iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), body].map(part => part.toString("base64url")).join(".");
}

function decrypt(value, context) {
  if (!isEncrypted(value)) return value; // Existing rows stay readable during migration.
  try {
    const parts = value.slice(PREFIX.length).split(".");
    if (parts.length !== 3) throw new Error();
    const [iv, tag, body] = parts.map(part => Buffer.from(part, "base64url"));
    if (iv.length !== 12 || tag.length !== 16 || !body.length) throw new Error();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key("encryption"), iv);
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8"));
  } catch {
    throw new Error("Customer data could not be decrypted; check the encryption key and stored data");
  }
}

function lookup(value, context) {
  if (typeof value === "string" && value.startsWith(HASH_PREFIX)) return value;
  return HASH_PREFIX + crypto.createHmac("sha256", key("lookup")).update(context).update("\0").update(String(value)).digest("hex");
}

module.exports = { PREFIX, HASH_PREFIX, isEncrypted, encrypt, decrypt, lookup };
