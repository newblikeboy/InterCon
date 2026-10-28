# r3 verification — 29 October 2026

The local r3 release includes the corrected privacy documentation and
number-specific document/photo/video delivery through the API and portal.

Completed checks:

- `npm test`: 153 tests passed, none failed. Includes new media-delivery tests
  with isolated temporary databases, synthetic files and mocked providers.
- `npm run check`: 137 JavaScript files passed syntax checking.
- `npm audit --omit=dev`: zero known vulnerabilities reported at verification.
- Existing `checkUi.js`: 40 browser checks passed with mocked APIs.
- `checkMediaDeliveryUi.js`: desktop/mobile, approved-template text, multipart
  file upload, client permission declaration, same-key retry, healthcare
  selection and preservation of shared-send mode passed.
- Source whitespace validation passed. The release package's SHA256 source
  manifest is checked when the ZIP is built; the ZIP has a separate checksum.

Meaningful coverage includes all three file types reaching the message worker,
correct number and template text in the provider request, wrong-recipient and
changed-number denial, private storage, idempotent/concurrent retries, upload
failure and stale-lease recovery, role/tenant isolation, opt-outs and verified
erasure with retained duplicate guards. In-progress uploads defer erasure while
further messaging is restricted.

No production database migration, provider upload/message or DigitalOcean
deployment was performed for these checks. Real provider delivery, supported
video codecs, template approval, credentials, proxy configuration, provider
regions/contracts and production storage/backup retention must be verified in
the manual rollout using synthetic files and an authorised test recipient.
This verification is not a legal compliance or independent security certification.
