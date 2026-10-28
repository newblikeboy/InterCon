# InterCon privacy and patient-report rollout — 29 October 2026

Local implementation is ready for review. This document is for a manual
DigitalOcean deployment; no droplet or production database migration has been
performed by these changes. Do not run commands against a database until you
have a restorable backup and the existing encryption key secured separately.

The **r3 source bundle** includes the current privacy documentation and
recipient-specific document, photo and video delivery. Use it instead of earlier
same-date ZIPs. The public notice focuses on data handling and rights; client
terms retain the healthcare responsibilities; technical details remain in this
runbook and the hardening guidance. See
[documentation boundaries](PRIVACY_DOCUMENTATION.md) and
[client report instructions](CLIENT_PATIENT_REPORTS.md). See [local release verification](RELEASE_VERIFICATION_2026-10-29.md) for the completed checks.

## What changed

- [Number-specific media delivery](RECIPIENT_MEDIA_DELIVERY.md): portal and API upload/queue for one number, private binding, safe retries and delivery tracking. Verify reverse-proxy upload limits and create the new uniqueness index before enabling the endpoint.

- Customer contact fields use authenticated AES-256-GCM encryption. Phone
  equality/search indexes use keyed hashes. Authorised users see ordinary
  contact details; hashes do not replace the contact list display. Related
  message, conversation, webhook, automation and privacy-request fields are
  protected too. Existing rows require the explicit migration below.
- New media uploads use Cloudinary authenticated delivery. Browser downloads
  pass through tenant-authorised, audited, non-cacheable application routes.
  Patient PDFs require a verified contact, permission reference and accepted
  workspace Data Processing Terms. Their sending/access expires after 30 days.
  Expiry does not imply physical deletion or recall of a delivered copy.
- A patient report can be sent only to its bound contact using a utility
  template. Enqueue and worker checks prevent a report being reused for a
  different recipient. Patient files cannot be template-approval samples.
- An inbound enquiry no longer becomes business-initiated opt-in. STOP and
  equivalent supported commands suppress subsequent delivery. Service-only
  permission cannot authorise marketing. Client declarations record the actor,
  purpose, notice version and permission reference where supplied; they do not
  independently verify the client's underlying consent evidence.
- Privacy Center supports access/export, correction, withdrawal, nomination,
  grievance and verified customer erasure. Owner/admin exports stream all
  matching records as NDJSON. Erasure blocks future delivery and report access,
  observes documented retention holds, cleans associated operational records,
  and preserves keyed suppression and webhook duplicate guards without their
  original personal payloads. Cleanup waits for pending matching webhook work.
  Fresh permission must be recorded
  through the restore workflow before re-adding an erased recipient.
- Privacy Policy and Data Processing Terms distinguish the client's duties
  from InterCon's duties, cover patient reports, service providers, transfers,
  retention, incidents and rights. Account requests require platform review;
  account/tenant deletion is not an automatic action.
- Security audit records omit request bodies, phone numbers and report
  contents. Audit retention is 400 days; webhook retention defaults to 366 days.
  Production startup rejects a shorter webhook retention setting. Business
  profiles, contact tags, old backups, exported files and provider copies need
  separate controls; field encryption does not cover every stored byte.
- Dependency updates include multer 2.5.0 and nodemailer 10.2.1 plus patched
  transitive packages. Use the supplied lockfile, not `npm audit fix --force`.

## Before deployment

1. Verify an Atlas/database backup can be restored. Preserve the current
   `DATA_ENCRYPTION_KEY` securely and ensure API and every worker use the same
   key. Never print it, paste it into chat, or generate a replacement during
   deployment. Existing Meta tokens also depend on the existing key setup.
2. Review Cloudinary credentials, provider region/subprocessor contracts,
   storage limits and invalidation permissions. Previously public assets will
   change delivery type. Old CDN links may remain cached until invalidation
   propagates; downloaded copies cannot be recalled.
3. Review old uploaded PDFs. They predate patient classification and cannot be
   reliably classified from filenames. Actual reports must be removed from
   general media/template samples and re-uploaded as patient reports with the
   correct contact. Do not onboard report delivery until this is completed.
4. Schedule a maintenance window. Stop all InterCon API, message, webhook,
   billing and autoscaler processes on every host. New encrypted writes are
   incompatible with older application binaries. Incoming provider webhooks
   may retry during downtime; monitor retries and queues after restart.

## Transfer the bundle

The generated source bundle contains `src`, `Public`, tests, package manifests
and rollout documentation. It excludes `.env`, node_modules, keys, database
backups and local audit exports. Keep the existing server `.env` in place.

Run from **local PowerShell**, replacing the SSH target with your existing one:

```powershell
scp .\artifacts\intercon-dpdp-2026-10-29-r3.zip YOUR_SSH_USER@YOUR_DROPLET:/tmp/
Get-FileHash .\artifacts\intercon-dpdp-2026-10-29-r3.zip -Algorithm SHA256
```

Run the following in the **droplet's Bash terminal**, one block at a time.
Replace `/YOUR/INTERCON/APP` and all process-name placeholders with existing
values. Stop on an error. These commands do not discover or stop unrelated apps.

```bash
set -euo pipefail
cd /YOUR/INTERCON/APP
node -e 'if(require("./package.json").name!=="intercon")process.exit(1)'
node --version
pm2 list
sha256sum /tmp/intercon-dpdp-2026-10-29-r3.zip
```

Compare the checksum with the local result. Local validation used Node 22.17.1;
use a supported Node version compatible with this lockfile. Review your actual
PM2 process names before the stop command. Omit a placeholder if that process
does not exist; add other InterCon replicas if present.

```bash
pm2 stop ACTUAL_API_NAME ACTUAL_MESSAGE_WORKER_NAME ACTUAL_WEBHOOK_WORKER_NAME ACTUAL_BILLING_WORKER_NAME ACTUAL_AUTOSCALER_NAME
umask 077
CODE_BACKUP="$(mktemp -d /var/tmp/intercon-code-backup.XXXXXX)"
tar --exclude='./.env*' --exclude='./node_modules' --exclude='./.git' --exclude='./logs' --exclude='./uploads' --exclude='./artifacts' -czf "$CODE_BACKUP/source.tgz" .
printf 'Code backup: %s\n' "$CODE_BACKUP/source.tgz"
unzip -o /tmp/intercon-dpdp-2026-10-29-r3.zip -d .
npm ci --omit=dev
npm run check
npm audit --omit=dev
```

The code backup intentionally excludes secrets; the database and key backup in
the prerequisites are separate. Keep the application stopped until all
preflight and migration steps succeed.

Update only the webhook retention setting in the existing `.env`:

```bash
node <<'NODE'
const fs = require('fs');
const file = '.env';
let text = fs.readFileSync(file, 'utf8');
if (/^\s*(?:export\s+)?WEBHOOK_RETENTION_DAYS\s*=/m.test(text)) {
  text = text.replace(/^\s*(?:export\s+)?WEBHOOK_RETENTION_DAYS\s*=.*$/gm, 'WEBHOOK_RETENTION_DAYS=366');
} else text += '\nWEBHOOK_RETENTION_DAYS=366\n';
fs.writeFileSync(file, text);
console.log('Webhook retention set; other settings preserved.');
NODE
NODE_ENV=production WEBHOOK_RETENTION_DAYS=366 node -e 'require("./src/config/validate").assertProductionEnvironment(); console.log("Production configuration valid")'
```

If preflight fails, fix the named setting locally on the server before
continuing. Keep the current encryption key. If the previous deployment relied
on a JWT-secret fallback for already encrypted tokens, migrate that key setup
with a recovery plan first; changing to an unrelated key loses decryption.
Configuration validity does not verify provider credentials or database access.

Inspect first; these commands do not migrate records:

```bash
npm run encrypt:customer-data
npm run privacy:maintenance -- indexes
npm run privacy:maintenance -- consent
npm run privacy:maintenance -- media
npm run privacy:maintenance -- review
```

Review counts and verify the intended database/provider. Apply the migrations
with the application and all workers still stopped:

```bash
npm run privacy:maintenance -- indexes --apply
npm run privacy:maintenance -- consent --apply
npm run privacy:maintenance -- media --apply
npm run encrypt:customer-data -- --apply
npm run encrypt:customer-data
npm run privacy:maintenance -- indexes
npm run privacy:maintenance -- media
npm run privacy:maintenance -- review
npm run db:indexes
```

Final encryption inspection must show zero pending rows and zero conflicts.
Media inspection must show zero public assets pending migration; TTL inspection
must show no pending changes. Do not restart on migration failure. The jobs are
repeatable; fix the cause and rerun. A legacy public file conversion changes
Cloudinary itself and cannot be undone by restoring MongoDB alone.

Restart the same actual processes on the new code and shared key. The explicit
retention environment also replaces an old value stored in PM2; update any
separate ecosystem/service configuration to preserve it on future restarts.

```bash
NODE_ENV=production WEBHOOK_RETENTION_DAYS=366 pm2 restart ACTUAL_API_NAME ACTUAL_MESSAGE_WORKER_NAME ACTUAL_WEBHOOK_WORKER_NAME ACTUAL_BILLING_WORKER_NAME ACTUAL_AUTOSCALER_NAME --update-env
pm2 list
curl --fail --silent --show-error https://YOUR_INTERCON_DOMAIN/api/health
curl --fail --silent --show-error https://YOUR_INTERCON_DOMAIN/api/health/ready
pm2 save
```

Keep the app in maintenance until readiness and checks succeed. API readiness
does not prove every worker is healthy: inspect worker status/queue processing
and sanitized logs as well. Perform a test with a synthetic PDF and an
authorised test recipient you control. Check ordinary contact display/search,
terms acceptance, report recipient verification, utility-template delivery,
wrong-recipient denial, Privacy Center export and STOP suppression. Verify an
old public URL no longer retrieves its content after CDN invalidation. Do not
send real patient files as test fixtures.

## Retention and regular operation

- Review `npm run privacy:maintenance -- review` regularly for overdue requests,
  expired report access and unmigrated public assets. No scheduled job is
  installed by this change.
- `npm run privacy:maintenance -- media-expiry` only inspects expired reports whose
  last processing is at least 366 days old and whose hold has ended.
  `npm run privacy:maintenance -- media-expiry --apply` deletes eligible provider
  assets and records. Review eligibility and backups first. Do not treat a
  30-day access expiry as a promise that files have been physically erased.
- The prospective DPDP minimum-processing-retention hold begins conservatively
  on 13 May 2027 in code, subject to legal/commencement review. Verified erasure
  can defer cleanup while immediately blocking future contact/report access.
  A lab must communicate its own applicable clinical/legal retention duties.
- Ordinary deletions do not erase backup snapshots or recipients' copies.
  Define backup expiry, provider backup deletion and restoration procedures;
  reapply suppression and erasure decisions before restored data is served.
- Restrict access to the encryption key and database independently. Back up the
  key securely. Old Redis recipient keys expire naturally, up to 48 hours;
  existing rate-limit counters are not flushed during migration.
- Upload temp directories are private per upload and cleaned on request
  completion. Monitor disk space and arrange safe, age-based cleanup of
  abandoned `intercon-private-*` directories after process crashes. Do not
  indiscriminately clear a shared temporary directory.

## Business actions still required

The client/lab normally decides why patient data is used and obtains/verifies
the required permissions. InterCon still has processor, security, contractual
and cooperation duties, and is responsible for its own account/billing data.
The platform records client permission declarations; it cannot replace the
lab's verified patient/guardian permission and correct-recipient checks.

Designate an accountable privacy contact and keep `support@intercon.in`
monitored. The policy publishes this existing business contact; it does not
invent a named officer or claim InterCon is designated a Significant Data
Fiduciary. Review applicable current SPDI grievance-officer publication duties
with counsel and add the actual person's designation/name/contact as required.
Formal DPO requirements are distinct from an ordinary privacy contact.

Execute client Data Processing Terms and appropriate vendor contracts; verify
the actual Atlas, Cloudinary, DigitalOcean, Meta, payment and email provider
locations, safeguards and permitted onward processing. No India-only hosting
claim is made. Arrange India-based ICT-log retention for at least 180 days where
CERT-In directions apply, clock synchronisation and restricted, monitored log
storage. App log generation alone does not implement the server retention plan.

Maintain an incident response owner and escalation process: assess applicable
CERT-In six-hour reporting separately from phased DPDP affected-person/Board
notifications, including the later detailed 72-hour Board submission. Ensure
staff can revoke credentials, stop access and preserve evidence. Establish
identity/guardian verification, rights-request handling, lawful retention and
vendor-deletion procedures before real patient report use. Collect no report
PDFs through support email. Health messaging must also meet WhatsApp policy and
other applicable medical/confidentiality rules.

## Rollback

Do not restart old code after encryption. It cannot interpret protected fields.
Prefer fixing forward with a compatible reader. A full rollback requires the
pre-migration database, its exact key and a compatible provider-media plan;
Cloudinary private-delivery changes, already delivered messages and expired
external caches are independent of database rollback. Do not make reports public
again as a shortcut. Reconcile any external provider changes before resuming.

## Verification and legal basis

Local checks: `npm run check`, `npm test`, `npm audit`, and
`node src/scripts/checkPrivacyUi.js` and `node src/scripts/checkMediaDeliveryUi.js` (isolated temporary replica-set and browser;
requires development dependencies and Playwright Chromium). Tests use
synthetic records/provider mocks; they do not certify the live server.

This is a technical implementation and operational checklist, not a legal
compliance certification. Review new notifications and contractual requirements
before deployment, especially during phased commencement:

- [DPDP Act 2023](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
- [November 2025 commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf)
- [Final DPDP Rules 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)
- [CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf)
- [MeitY clarification of SPDI Rules](https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=74990)
- [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy)
- [Cloudinary media access controls](https://cloudinary.com/documentation/control_access_to_media)
