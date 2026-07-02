const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "http://localhost:5000";
process.env.REDIS_URL = "";
process.env.FB_APP_SECRET = "test-app-secret-that-is-not-production";
process.env.META_APP_SECRET = "";

const app = require("../src/app");

test("health endpoint sends defensive browser headers", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.match(response.headers["content-security-policy"], /default-src 'self'/);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.ok(response.headers["x-request-id"]);
});

test("Facebook authentication endpoint is removed", async () => {
  await request(app)
    .post("/api/auth/facebook")
    .set("Origin", "http://localhost:5000")
    .send({})
    .expect(404);
});

test("unsafe browser requests require a trusted origin", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({})
    .expect(403);

  await request(app)
    .post("/api/auth/signup")
    .set("Origin", "https://attacker.example")
    .send({})
    .expect(403);
});

test("Meta webhooks reject missing signatures", async () => {
  await request(app)
    .post("/api/webhooks/meta")
    .send({ object: "whatsapp_business_account", entry: [] })
    .expect(403);
});
