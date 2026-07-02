const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-with-at-least-thirty-two-characters";
process.env.DATA_ENCRYPTION_KEY = "test-data-key-that-is-distinct-and-at-least-thirty-two";

const authorize = require("../src/middleware/authorize");
const { signAuthToken, verifyAuthToken } = require("../src/services/authToken.service");
const { encryptSecret, decryptSecret } = require("../src/utils/crypto");

test("role middleware rejects a role outside its allowlist", () => {
  let receivedError;
  authorize("owner")(
    { user: { role: "agent" } },
    {},
    (error) => {
      receivedError = error;
    }
  );
  assert.equal(receivedError.statusCode, 403);
});

test("auth tokens enforce signed claims", () => {
  const token = signAuthToken({
    _id: "507f1f77bcf86cd799439011",
    tenantId: "507f1f77bcf86cd799439012",
    role: "owner",
    sessionVersion: 2
  });
  const payload = verifyAuthToken(token);
  assert.equal(payload.sv, 2);
  assert.throws(() => verifyAuthToken(`${token.slice(0, -1)}x`));
});

test("stored secrets use authenticated encryption", () => {
  const encrypted = encryptSecret("provider-secret");
  assert.notEqual(encrypted, "provider-secret");
  assert.equal(decryptSecret(encrypted), "provider-secret");

  const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("a") ? "b" : "a"}`;
  assert.throws(() => decryptSecret(tampered));
});
