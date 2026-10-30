# Pathlogy Native automatic report delivery

Local update for Pathlogy 2.4.2, 29 October 2026. This document does not indicate a production deployment. Pathlogy accepts either the HTTPS origin or the full `/api/v1/messages/send-media` URL.

## Setup API

Both GET routes use the existing API-key middleware, tenant isolation and `Cache-Control: no-store`.

- `GET /api/v1/integration/status`: `success`, `contractVersion: 1`, `reportSendingAvailable: true`, workspace ID/name, `whatsappConnected` and `processingTermsAccepted`. No Meta credential, contact or clinical record is returned. Stored connection flags do not replace live send/plan/Meta checks.
- `GET /api/v1/templates/approved`: up to 500 approved utility/document templates with name, language, body, parameter count and `reportConfigured`. Neither binding configuration nor approval sample media is exposed. Pathlogy shows only configured templates (or zero-parameter templates).

The operator sees only server, API key, template and Connect/Connection successful. No variable editor, delivery history, status, refresh, retry panel or separate send dialog remains.

## Administrator configuration

In InterCon, open **API** and select the **Integration** card to the right of **API Access**. It opens a separate Integration screen listing all approved utility/PDF templates eligible for report mapping, with their language and **Mapping pending** or **Mapping ready** status. Select **Map fields** or **Edit mapping** to open **Report Field Mapping**. Workspace owners and admins can link each `{{1}}`…`{{n}}` placeholder to Patient Name, Report ID, Lab Name, Test Name or Collection Date, or enter fixed business text. Save the mapping once per template and language. Zero-placeholder templates are ready without configuration. Common Media, unapproved and non-utility/non-document templates are not eligible. Mapping controls and status do not appear in Manage Template or API Access.

The dashboard uses session-authenticated, tenant-scoped `GET` and `PATCH /api/templates/:templateId/report-mapping` endpoints restricted to owner/admin roles. PATCH accepts `{ "bindings": ["patientName", "labName"] }`; the placeholder count and supported fields are validated before saving. Mapping definitions are excluded from general template lists and desktop discovery. The dedicated admin GET returns the saved bindings and available source fields. The desktop's next template lookup reflects the saved configuration; reconnect Pathlogy if its template list was already loaded.

The server CLI remains available as an alternative. Create a JSON configuration such as:

```json
{
  "tenantId": "ACTUAL_WORKSPACE_OBJECT_ID",
  "templateName": "lab_report_ready",
  "language": "en",
  "bindings": ["reportId", "labName"]
}
```

Run `node src/scripts/configureReportTemplate.js path/to/report-template.json` from InterCon. The script validates the workspace, exact approved utility/PDF template and placeholder count before saving. The example matches `Your report {{1}} from {{2}} is attached.`

Supported sources: `patientName`, `reportId`, `labName`, `testName`, `collectedAt`; fixed business text may use `{ "literal": "Report ready" }`. Never use patient-specific literals. Existing approved templates with body placeholders need this explicit mapping before the simplified desktop can select them. No positional meaning is guessed from the number of placeholders. No mapping is required for a zero-placeholder template.

## Automatic send API

The desktop uses the existing `POST /api/v1/messages/send-media`, API-key authentication, multipart upload, required `Idempotency-Key`. Automatic reports opt in with `reportMode=automatic`, plus `to`, `file`, `templateName`, `language`, `reportId`, the mapped metadata sources, `permissionConfirmed=true` and `consentReference`. Standard media requests without reportMode keep their existing contract. `/api/v1/integration/send-report` remains a compatibility alias; retries across both paths share the same receipt. The desktop sends single-line metadata, not measured results or its registry. Report fields are limited to 300 characters. Automatic mode rejects caller-controlled variables, general/marketing purpose or consent-scope overrides.

InterCon resolves body values from its approved template mapping and calls the existing recipient-media delivery service with `purpose=patient_report` and `consentScope=service_only`. Existing consent/suppression, patient-report terms, private storage/binding, billing, throttling, worker and Meta checks apply. Response remains the existing 202 receipt with message ID; a queue receipt is not delivery confirmation.

Receipts freeze binding configuration and a keyed metadata hash, not patient metadata or resolved values. Replay reuses those bindings even if the template mapping/status changes; the existing file/payload fingerprint and unique request indexes still reject changed requests. Erasure clears bindings and preserves minimal keyed duplicate guards. Repeating an erased request returns 410. Static business literals must not contain patient-specific data.

The desktop uploads/retries/checks receipts silently, with exact request snapshots, persisted backoff and restart recovery. Repeated operator clicks reuse an existing request, including after delivery. Once accepted by InterCon, delivery proceeds on server workers even with the desktop closed. Administrator investigation stays in InterCon; operators never need to refresh or retry statuses manually. A one-time number-bound permission declaration is recorded on the desktop if absent; it does not independently obtain patient consent or verify professional/guardian authority.

## Rollout and verification

Apply the complete 2.4.2 overlay, preserving production `.env` and encryption key. This supersedes earlier desktop overlays. It adds model fields but no npm dependencies or new database indexes. The underlying [r3 privacy/media rollout](DPDP_ROLLOUT_2026-10-29.md), stable encryption key, uniqueness indexes, proxy upload limit, private Cloudinary storage and running message/webhook workers remain prerequisites. Configure template mappings after deployment, then reconnect the desktop. The production send-media endpoint alone does not imply the setup/template-discovery APIs or automatic-mode extension have been deployed.

Defaults remain one active workspace key and 500 assets / 512 MB retained storage. Coordinate key rotation and provision report retention capacity. This update does not change quotas or erase files.

Local verification: the 2.4.1 full run passed 139-file syntax checks and all 156 backend tests. The 2.4.2 endpoint fix passed syntax checking and all 15 focused media-delivery tests, including automatic reports through send-media, standard media requests and same-receipt replay through the earlier alias. Added coverage includes backend resolution, mapping freeze across changed/paused templates, changed-metadata denial, missing mapping/permission denial, no raw metadata in receipts, erased request denial and hidden mapping configuration. Desktop checks cover full-endpoint acceptance, the three-field screen, direct Send button, internal tracking, background backoff/restart recovery and duplicate clicks. All automated providers/recipients are synthetic or mocked; real deployment and authorised live delivery still need verification.
