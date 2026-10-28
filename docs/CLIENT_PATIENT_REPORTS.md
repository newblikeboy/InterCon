# Sending a patient's report with InterCon

Client instructions for the current implementation, 29 October 2026. Use only
after the updated application and its privacy migrations have been deployed.

## Before uploading

The workspace owner accepts the current Data Processing Terms in Privacy
Center. The lab establishes that WhatsApp delivery is appropriate and permitted
for the report, verifies the recipient's number and authority, and obtains the
necessary permission. Keep the underlying notice and permission evidence in the
lab's own process; an InterCon declaration does not obtain patient consent.

Ensure the intended patient or authorised guardian has an active contact record
in the workspace with the required messaging permission. Use service-only
permission when it reflects the person's choice; report-delivery permission
must not be treated as marketing permission.

## Upload and send from the portal

Open **Send WhatsApp**, choose **File for one number**, enter the verified number
and choose **Patient report (PDF)**. Select the approved utility template, fill
its text values, attach the patient's PDF, enter the permission reference and
confirm the client declaration. Review and queue the delivery, then check status.
Repeat for the next patient and file.

Alternatively upload a patient report in Media Library using its confidential
classification and selected contact. An existing bound `mediaId` can be used by
the template API for that same contact. The shared-media bulk selector excludes
recipient-specific files. Use synthetic documents for template approval.

## API capability

The new API-key endpoint `POST /api/v1/messages/send-media` accepts one PDF and
recipient together as multipart form data, plus the approved utility template,
text variables, `purpose=patient_report`, permission confirmation/reference and
an opaque idempotency key. The response returns a message ID for tracking.
See [the complete media-delivery guide](RECIPIENT_MEDIA_DELIVERY.md) for fields,
examples, retry rules and limits. The existing `send-template` endpoint still
accepts previously uploaded `mediaId` values for the matching recipient.

## Access, copies and requests

Download and new-send access expires after 30 days by default. That expiry does
not physically erase the underlying file or remove copies already delivered,
downloaded or forwarded. Data deletion remains subject to verified instructions,
applicable minimum retention and documented holds. Keep the required clinical
archive in the lab's own record system.

Patients should contact the lab for access, correction, withdrawal or erasure.
An authorised workspace owner/admin can record and handle verified customer
requests in Privacy Center. Report suspected wrong-recipient disclosures or
security incidents promptly to support@intercon.in without attaching patient
reports. Read the current Privacy Policy and Data Processing Terms for the
applicable responsibilities and limitations.
