const crypto = require("crypto");
const env = require("../config/env");
const HttpError = require("./httpError");

const ENCRYPTION_PREFIX = "enc:v1:";

function getKey() {
  if (!env.dataEncryptionKey) {
    throw new HttpError(500, "DATA_ENCRYPTION_KEY, JWT_SECRET, or SESSION_SECRET is required for data encryption");
  }

  return crypto.createHash("sha256").update(env.dataEncryptionKey).digest();
}

function encryptSecret(value) {
  if (!value) return value;

  const plainText = String(value);
  if (plainText.startsWith(ENCRYPTION_PREFIX)) {
    return plainText;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    ".",
    tag.toString("base64url"),
    ".",
    encrypted.toString("base64url")
  ].join("");
}

function decryptSecret(value) {
  if (!value) return value;

  const encryptedValue = String(value);
  if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedValue;
  }

  const encoded = encryptedValue.slice(ENCRYPTION_PREFIX.length);
  const [ivText, tagText, encryptedText] = encoded.split(".");

  if (!ivText || !tagText || !encryptedText) {
    throw new HttpError(500, "Encrypted secret is malformed");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

module.exports = {
  decryptSecret,
  encryptSecret
};
