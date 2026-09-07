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
  const csp = response.headers["content-security-policy"];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /connect-src[^;]*https:\/\/connect\.facebook\.net/);
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

test("technical SEO files are public and point to canonical production URLs", async () => {
  const sitemap = await request(app).get("/sitemap.xml").expect(200);
  assert.match(sitemap.headers["content-type"], /xml/);
  assert.match(sitemap.text, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap.text, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap.text, /<loc>https:\/\/intercon\.in\/<\/loc>/);
  assert.match(sitemap.text, /<loc>https:\/\/intercon\.in\/privacy-policy<\/loc>/);
  assert.doesNotMatch(sitemap.text, /\/api\/|\/customer|\/admin/);
  assert.doesNotMatch(sitemap.text, /^\{/);
  assert.doesNotMatch(sitemap.text, /<!DOCTYPE html>/i);

  const robots = await request(app).get("/robots.txt").expect(200);
  assert.match(robots.headers["content-type"], /text\/plain/);
  assert.match(robots.text, /User-agent: \*/);
  assert.match(robots.text, /Allow: \//);
  assert.match(robots.text, /Disallow: \/api\//);
  assert.match(robots.text, /Sitemap: https:\/\/intercon\.in\/sitemap\.xml/);
  assert.doesNotMatch(robots.text, /^\{/);
  assert.doesNotMatch(robots.text, /<!DOCTYPE html>/i);
});

test("public pages expose canonical metadata and private pages remain protected", async () => {
  const home = await request(app).get("/").expect(200);
  assert.match(home.text, /<title>InterCon \| Omnichannel Business Messaging/);
  assert.match(home.text, /<meta name="description" content="InterCon by Synqvest System LLP is an omnichannel business messaging platform\./);
  assert.match(home.text, /<link rel="canonical" href="https:\/\/intercon\.in\/">/);
  assert.doesNotMatch(home.text, /noindex/i);

  const policy = await request(app).get("/privacy-policy").expect(200);
  assert.match(policy.text, /<link rel="canonical" href="https:\/\/intercon\.in\/privacy-policy">/);
  assert.doesNotMatch(policy.text, /noindex/i);

  await request(app).get("/admin").expect(401);
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
