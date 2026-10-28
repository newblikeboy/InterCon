# Privacy documentation and implementation boundaries

Revised 29 October 2026 before publication of the current policy draft.

## Public Privacy Policy

`Public/privacy-policy.html` explains the data processed, purposes, roles,
recipients/providers, retention, rights and contact information. It describes
security at an understandable level. It explicitly covers permitted health
information, without turning the platform's general privacy notice into a
pathology-specific operating manual.

Keep meaningful product limitations public: recipient-file download/new-send access
expires after 30 days; access expiry does not delete the file or recall a
recipient's copy; message-delivery event records default to 366 days and
security audit records to 400 days; other records are subject to purpose,
deletion instructions, applicable minimum retention and legal holds. Moving
technical instructions out of the policy must not conceal actual processing,
providers, retention or material limitations.

## Client Data Processing Terms and user instructions

`Public/data-processing-policy.html` allocates client and InterCon duties,
including consent evidence, recipient authority, confidentiality, permitted
healthcare processing, providers, assistance and deletion. It retains the
client's obligation to use the confidential-report workflow and avoid real
patient information in template samples. It does not describe implementation
mechanics or deployment steps.

See [the client report instructions](CLIENT_PATIENT_REPORTS.md) for the current
portal/API workflow and its limitations. These instructions do not expand the
client's legal authority or replace the terms.

## Internal implementation and operations

See [hardening guidance](HARDENING_AND_SCALING.md) and
[the rollout runbook](DPDP_ROLLOUT_2026-10-29.md). These repository documents are
operational documentation, not public website notices. Do not publish source
release ZIPs or internal documents in the public static directory.

The implementation remains unchanged by the wording revision:

- Contact and related fields use model-bound authenticated encryption, with
  keyed lookup/search representations and a shared, stable encryption key.
- Media uses authenticated Cloudinary delivery. Browser content is proxied
  through tenant/role checks, with non-cacheable responses. Provider download
  links are generated with short expiry at delivery time.
- Patient reports require current workspace terms acceptance, a permitted
  contact, a recorded verification declaration and permission reference.
  Recipient and utility-template checks run both before enqueue and before
  provider delivery. Real patient reports cannot be template samples.
- Erasure handles linked operational records, provider assets, pending sends
  and webhook work. Minimal suppression and duplicate-delivery records remain
  without original personal payloads. Required retention may defer erasure.
- Security audit and webhook retention use database expiry indexes; existing
  indexes require an explicit migration. Migration commands and deployment
  state belong in the runbook, not in a public policy paragraph.
- Incident escalation deadlines, backup recovery, provider contract review,
  privacy-contact ownership and hosting/log-retention checks remain operational
  obligations. A published policy does not demonstrate that they are complete.

Before publication, complete the rollout and operational checks; do not publish
claims for a deployment that has not implemented the corresponding controls.
No live server or database was changed by this editorial revision.

## Revision and evidence

The unpublished 2026-10-29 draft was edited for clarity and document scope;
existing policy acceptance identifiers and security behavior were not changed.
If an earlier version has since been published or accepted by real clients,
review the changes and provide any required notice or renewed acceptance before
using the revised terms.

Competitor sources informed the document structure, not claims that their
backend controls are absent or that InterCon has equivalent certifications:

- [Wati public privacy policy](https://www.wati.io/privacy-policy/)
- [Wati security overview](https://support.wati.io/en/articles/11463219-wati-security-overview-data-protection-backups-and-hosting)
- [Interakt terms](https://www.interakt.shop/terms-of-service/)
- [AiSensy Direct API privacy policy](https://m.aisensy.com/direct-api-privacy-policy/)
- [Gupshup privacy policy](https://www.gupshup.ai/privacy-policy)
- [Gupshup enterprise security](https://www.gupshup.ai/en/enterprise-security)

Legal reference: [final DPDP Rules 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf),
including the notice framework and phased commencement. Do not treat a
competitor's wording as legal approval for a particular medical use case.

The r3 release extends these safeguards to recipient-specific business PDFs, photos and videos. See [the media-delivery guide](RECIPIENT_MEDIA_DELIVERY.md) for API/portal behavior and operational recovery. Public retention wording now covers all recipient-specific files.
