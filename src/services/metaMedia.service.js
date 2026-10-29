const fs = require("fs");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { fetchWithPolicy } = require("../utils/httpClient");

const LIFETIME_MS = 30 * 86400000 - 5 * 60000;
const isMeta = asset => asset?.storageProvider === "meta";

async function context(tenantId, asset) {
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  const accessToken = tenant?.getMetaAccessToken();
  if (!tenant?.meta?.phoneNumberId || !accessToken) throw new HttpError(409, "Connect WhatsApp before uploading or accessing Unique Media");
  if (asset) assertAvailable(asset, tenant);
  return { phoneNumberId: tenant.meta.phoneNumberId, accessToken };
}

function assertAvailable(asset, tenant) {
  if (!asset.metaMediaId || !/^\d+$/.test(asset.metaMediaId)) throw new HttpError(410, "The file is no longer available; upload the original again");
  if (asset.metaMediaExpiresAt && new Date(asset.metaMediaExpiresAt) <= new Date()) throw new HttpError(410, "This temporary file has expired; upload the original again");
  if (String(asset.metaPhoneNumberId) !== String(tenant.meta?.phoneNumberId)) throw new HttpError(409, "The WhatsApp sending number changed; upload this file again for the current number");
}

async function providerJson(response, fallback) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new HttpError(response.status === 429 ? 429 : 502, fallback, { providerCode: data.error?.code });
  return data;
}

async function upload(tenantId, file, mimeType) {
  const { phoneNumberId, accessToken } = await context(tenantId);
  const body = new FormData();
  body.set("messaging_product", "whatsapp");
  body.set("type", mimeType);
  // File-backed Blob streams the existing temporary upload; no second PDF copy.
  body.set("file", await fs.openAsBlob(file.path, { type: mimeType }), file.originalname || "attachment");
  const response = await fetchWithPolicy(`https://graph.facebook.com/${env.metaGraphApiVersion}/${encodeURIComponent(phoneNumberId)}/media`, {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body
  }, { timeoutMs: 90000, retries: 0 });
  const data = await providerJson(response, "WhatsApp could not upload this file. Retry the same request and key");
  if (typeof data.id !== "string" || !/^\d+$/.test(data.id)) throw new HttpError(502, "WhatsApp did not return a valid media ID");
  return { metaMediaId: data.id, metaPhoneNumberId: String(phoneNumberId), metaMediaExpiresAt: new Date(Date.now() + LIFETIME_MS) };
}

async function content(asset, headers = {}) {
  const { phoneNumberId, accessToken } = await context(asset.tenantId, asset);
  const response = await fetchWithPolicy(`https://graph.facebook.com/${env.metaGraphApiVersion}/${encodeURIComponent(asset.metaMediaId)}?phone_number_id=${encodeURIComponent(phoneNumberId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await providerJson(response, "WhatsApp could not retrieve this file; it may have expired");
  let download;
  try { download = new URL(data.url); } catch { throw new HttpError(502, "WhatsApp returned an invalid media URL"); }
  // Never send the workspace token to an arbitrary URL returned upstream.
  if (download.protocol !== "https:" || download.username || download.password || download.port && download.port !== "443"
    || !["lookaside.fbsbx.com", "facebook.com", "fbcdn.net"].some(host => download.hostname === host || download.hostname.endsWith(`.${host}`))) {
    throw new HttpError(502, "WhatsApp returned an untrusted media URL");
  }
  return fetchWithPolicy(download.href, { redirect: "error", headers: { ...headers, Authorization: `Bearer ${accessToken}` } });
}

async function remove(asset) {
  // Expired provider copies cannot be used again; keep local metadata erasure independent.
  if (asset.metaMediaExpiresAt && new Date(asset.metaMediaExpiresAt) <= new Date()) return;
  const { accessToken } = await context(asset.tenantId, asset);
  const response = await fetchWithPolicy(`https://graph.facebook.com/${env.metaGraphApiVersion}/${encodeURIComponent(asset.metaMediaId)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` }
  }, { retries: 0 });
  if (response.status === 404) return;
  const data = await providerJson(response, "WhatsApp could not delete this file");
  if (data.success !== true) throw new HttpError(502, "WhatsApp did not confirm file deletion");
}

module.exports = { isMeta, upload, content, remove, assertAvailable };
