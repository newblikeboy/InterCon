# Number-specific document, photo and video delivery

Implemented locally on 29 October 2026. Deploy the r3 bundle and database indexes
before giving the new endpoint to clients. This is a common document/media
workflow for invoices, receipts, certificates, photos, videos and permitted
patient reports. Each request accepts one number and one file.

## Portal

Open **Send WhatsApp**, choose **Unique Media**, then enter the number,
choose an approved media-header template, fill its text variables and choose
the recipient's file. Confirm the necessary authority/permission and review the
number, file and text before queueing. Repeat for the next recipient/file.

**Shared media / bulk message** retains the existing shared-asset sending flow.
Recipient-specific files do not appear in the shared-media selector or template
sample picker. The new feature does not add CSV-to-file mapping for bulk sends.

Media Library also supports **File for one contact** when uploading business
media. Patient reports always use recipient scope. An uploaded recipient file
can be sent by its existing `mediaId` through the template API, provided the
recipient matches. The portal's new direct-upload form takes the file itself.

## API: upload and queue in one request

`POST /api/v1/messages/send-media`

Authenticate with an active workspace API key in `Authorization: Bearer ...` or
`X-API-Key`. Send `multipart/form-data`; let the HTTP client generate its boundary.
An opaque `Idempotency-Key` header of 8–160 permitted characters is required.

| Field | Meaning |
| --- | --- |
| `to` | One WhatsApp number, preferably including country code. An Indian 10-digit number is normalised to +91. Arrays, multiple numbers and contact/group overrides are rejected. |
| `file` | One binary PDF, JPG/PNG photo or MP4/3GP video. Remote URLs and base64 JSON uploads are not accepted. |
| `templateName` | A Meta-approved template belonging to this workspace, with a matching document/image/video header. |
| `language` | Template language, recommended explicitly to avoid ambiguity. |
| `variables` | JSON array of text values matching the template's body placeholders, e.g. `["Priya","INV-123"]`. Use `[]` for a template without variables. |
| `permissionConfirmed` | `true`: the client declares that it is authorised to send the file to this number and has the necessary recipient permission. |
| `name` | Optional name when a new contact must be recorded. Existing contact details are preserved. |
| `purpose` | `general` for ordinary business files; `patient_report` for a patient-report PDF. Defaults to `general`. |
| `consentReference` | Optional client permission reference for general media; required for a patient report. No clinical results or identity-document scans. |
| `consentScope` | New contacts default to `service_only`. Use `business_messages` only when supported by the person's permission. Existing contact consent and suppression decisions are preserved. |

Example from **Bash**, using a utility document-header template with two body
parameters. Set `INTERCON_API_KEY` securely in your local environment; never
paste it into documentation or logs. Use a synthetic file/test number first.

```bash
curl --fail-with-body https://YOUR_INTERCON_DOMAIN/api/v1/messages/send-media \
  -H "Authorization: Bearer $INTERCON_API_KEY" \
  -H 'Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000' \
  -F 'to=919999999999' \
  -F 'name=Customer' \
  -F 'templateName=invoice_ready' \
  -F 'language=en' \
  -F 'variables=["Customer","INV-123"]' \
  -F 'purpose=general' \
  -F 'permissionConfirmed=true' \
  -F 'file=@./synthetic-invoice.pdf;type=application/pdf'
```

For a photo/video use the matching approved template and upload its file; the
endpoint and response format are the same. For patient reports also send
`purpose=patient_report` and the client's `consentReference`. Workspace Data
Processing Terms must already be accepted, and the template must be utility
with a PDF/document header. The client establishes any applicable patient,
representative or guardian authority; InterCon records the client declaration.

Successful queueing returns **HTTP 202**, for example:

```json
{
  "success": true,
  "message": "Recipient-specific media delivery queued",
  "queued": true,
  "idempotent": false,
  "deliveryId": "...",
  "messageId": "...",
  "mediaId": "MED-...",
  "status": "queued"
}
```

Queueing is not provider acceptance or delivery. Track the message using the
existing `GET /api/v1/messages/MESSAGE_ID` endpoint with the same workspace key.
Review `accepted`, `delivered`, `read`, `failed` and `uncertain` states as applicable.

## File and permission limits

- PDFs: up to 50 MB for this upload endpoint.
- Photos: JPG/PNG up to 5 MB.
- Videos: MP4/3GP up to 16 MB. The provider may additionally reject unsupported
  codecs/content; matching an extension/signature is not a full codec check.
- Approved-template text variables must match the required count. Arbitrary
  free-form captions or text do not replace the approved message body.
- New contacts record the client's permission declaration; existing opt-outs,
  inactive contacts and missing recorded opt-in block delivery. The endpoint
  does not silently restore an erased or opted-out recipient.
- Patient information must be classified correctly by the client. InterCon
  does not infer clinical content from an attachment or independently verify
  patient/guardian identity.

## Binding and retries

Files use authenticated provider storage. Each recipient-specific file is bound
to the workspace contact and the normalised number at upload. Both enqueue and
delivery checks enforce the binding; changing a contact's number does not move
an older file to the new number. Browser downloads require workspace owner/admin
access. Recipient files cannot be used as template-approval samples.

Retry an interrupted or failed request with **the same key and identical number,
file, template, variables and declarations**. A completed retry returns the
original message ID with `idempotent: true`. Reusing a key for different details
returns 409. Use a new key for an intentional new delivery, not to work around
an unknown outcome. Keys are scoped to the workspace across API keys and portal.

An active request may return 409 while processing; wait briefly and retry the
same request. Processing leases expire after ten minutes, allowing safe recovery
with the same file/key; the message uniqueness guard prevents a second queued
message for that request. A known upload failure can be retried earlier.
Failed/interrupted attempts may retain a private file for safe retry; review
these records and provider assets before cleanup. No exactly-once guarantee is
made for an external provider's network delivery outcome.

Erasure preserves minimal keyed request receipts and suppressions so an old
request cannot recreate delivery. Repeating an erased request returns 410.
Fresh verified permission/restoration and a new request are needed for a new
lawful contact. Erasure waits for in-progress upload/send work to finish or be
recovered while restricting further contact and access.

## Deployment and operation

Use the [r3 rollout runbook](DPDP_ROLLOUT_2026-10-29.md), including the encryption,
private-storage and consent migrations for existing production data. Run
`npm run db:indexes` before starting all API/worker instances so the new
`MediaDelivery` uniqueness index is present. All instances share the same
database and stable encryption key. No dependency update is needed for this
feature beyond the supplied existing lockfile.

Ensure the reverse proxy permits multipart requests of at least 50 MB plus
overhead. For Nginx, review the active site configuration, for example
`client_max_body_size 55m;` and an appropriate `proxy_read_timeout 120s;`.
Validate with `sudo nginx -t` before reloading. Match the app's existing upstream
and TLS configuration; do not replace the whole site config with these snippets.

Downloads and new sends for recipient-specific files expire after 30 days.
Expiry does not delete already delivered copies or bypass applicable retention
and legal holds. `npm run privacy:maintenance -- media-expiry` inspects eligible
expired recipient files; `--apply` deletes only eligible records/provider assets
after review. The existing `reports` task remains an alias for compatibility.
The eligibility minimum is 366 days since last processing and no active hold.
No scheduler is installed automatically. Plan storage capacity for retained files.

Use `npm run privacy:maintenance -- review` to inspect failed/stalled delivery
counts. `npm run privacy:maintenance -- deliveries` inspects expired processing
leases. For operator recovery, stop InterCon processes and back up first, then
`npm run privacy:maintenance -- deliveries --apply` reconciles an existing
message or marks the expired receipt retryable; it never sends a message. Restart
and have the client retry its original request/key. Do not delete receipt rows
or clear idempotency indexes to recover a request.

Verification uses synthetic data and provider mocks:

```text
node --test test/media-delivery.test.js
node src/scripts/checkMediaDeliveryUi.js
npm test
npm run check
```

Client instructions, public privacy disclosures and internal implementation
details remain separated as described in [documentation boundaries](PRIVACY_DOCUMENTATION.md).
