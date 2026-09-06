const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "http://localhost:5000";
process.env.REDIS_URL = "";
process.env.AUTH_LOGIN_RATE_LIMIT_MAX = "3";
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

test("landing session check is public and me remains protected", async () => {
  const session = await request(app).get("/api/auth/session").expect(200);
  assert.equal(session.body.authenticated, false);

  await request(app).get("/api/auth/me").expect(401);
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

test("signup rejects non-numeric or non-10-digit mobile numbers", async () => {
  const response = await request(app)
    .post("/api/auth/signup")
    .set("Origin", "http://localhost:5000")
    .send({
      business_name: "Example Business",
      contact_person: "Example Owner",
      email: "owner@example.com",
      mobile_number: "+91 98765 43210",
      password: "Password1",
      confirm_password: "Password1"
    })
    .expect(400);

  assert.equal(response.body.message, "Enter a 10-digit mobile number using numbers only");
});

test("Meta webhooks reject missing signatures", async () => {
  await request(app)
    .post("/api/webhooks/meta")
    .send({ object: "whatsapp_business_account", entry: [] })
    .expect(403);
});


test("changing bogus API keys and cookies cannot bypass the login IP limit", async () => {
  for (let index = 0; index < 6; index++) {
    await request(app).post("/api/auth/login").set("Origin", "http://localhost:5000")
      .set("X-API-Key", "bogus-" + index).set("Cookie", require("../src/config/env").authCookieName + "=bogus-" + index)
      .send({ email: "attempt" + index + "@example.test" }).expect(index < 3 ? 400 : 429);
  }
});
