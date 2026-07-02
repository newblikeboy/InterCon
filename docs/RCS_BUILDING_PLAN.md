# RCS Building Plan

## Locked strategic decision

InterCon will pursue direct registration as a Google RCS for Business partner.

InterCon will manage client brands, agents, service integration, webhooks,
verification, carrier launches, messaging, reporting, and billing itself.
An upstream RCS aggregator is not the planned operating model.

## Product model

The InterCon home page is a service launcher with three workspaces:

- WhatsApp
- RCS
- SMS

The RCS workspace menu is:

1. Dashboard
2. Setup
3. Send RCS
4. Inbox
5. Reports
6. Payments
7. API

Unlike WhatsApp onboarding, RCS onboarding does not connect a client phone
number. InterCon creates a brand and branded RCS agent for the client, tests
the agent, completes brand verification, and requests launch on selected
carrier networks.

## Phase 1: Partner registration

Prepare and submit the Google RCS for Business Partner Registration Interest
Form with:

- InterCon legal company information
- Corporate website and email
- Privacy Policy and Terms of Service
- Primary countries of operation
- Expected client and message volumes
- Planned RCS use cases
- Business and technical contacts
- Description of the InterCon platform

Google partner approval is an external dependency. Product development can
continue while the application is under review.

## Phase 2: Partner foundation

Build the shared RCS foundation:

- `RcsBrand` model
- `RcsAgent` model
- Agent onboarding state machine
- Country and carrier launch-status records
- Verification information and document storage
- Channel-specific consent and opt-out records
- RCS message and rich-content models
- Provider-neutral message queue
- Usage and billable-event ledger
- Audit log

Recommended agent states:

```text
draft
profile_incomplete
ready_for_testing
testing
verification_ready
verification_submitted
launch_submitted
partially_launched
launched
rejected
suspended
```

## Phase 3: Google partner integration

After partner approval:

- Configure the InterCon RCS partner account
- Create and securely store the service-account key
- Configure the partner webhook
- Validate webhook signatures
- Integrate the Business Communications Management API
- Integrate the RCS Business Messaging API
- Add monitoring, idempotency, retries, and durable event processing

The partner credentials and webhook configuration belong to InterCon. They
must not be exposed to client accounts.

## Client onboarding workflow

The RCS Setup page guides each client through:

1. Business Details
2. Agent Configuration
3. Agent Profile
4. Consent and Opt-Out
5. Test Devices
6. Brand Verification
7. Carrier Launch
8. Production Activation

### Business Details

Collect:

- Legal and trading names
- Business registration and tax information
- Registered address and operating country
- Website
- Privacy Policy URL
- Terms of Service URL
- Authorized brand representative
- Individual corporate email address
- Authorization for InterCon to manage the RCS agent

### Agent Configuration

Collect and confirm:

- Owning brand
- Agent name
- Hosting region
- Use case: OTP, Transactional, Promotional, or Multi-use
- Billing category: Conversational or Non-conversational
- Target countries
- Expected traffic volume

The UI must warn clients before confirming values that cannot be easily
changed after agent creation or launch.

### Agent Profile

Collect:

- Display name
- Logo
- Banner
- Description
- Brand colour
- Support phone
- Support email
- Website
- Privacy Policy and Terms links

### Consent and Opt-Out

Configure:

- Consent collection method
- Consent proof
- Permitted message purpose
- Opt-out keywords and response
- Resubscribe behaviour
- Suppression-list rules
- Separate consent for any SMS or WhatsApp fallback

### Test Devices

Support:

- Adding tester phone numbers
- Sending tester invitations
- Tracking invitation status
- Capability checks
- Sending test messages
- Testing rich content, replies, delivery events, and opt-out

### Brand Verification

Support:

- Authorized brand contact details
- Authorization-document upload
- Verification submission
- Verification status polling
- Rejection reasons and resubmission

### Carrier Launch

Support:

- Listing launchable countries and carriers
- Selecting carriers
- Launch-readiness questionnaire
- Reviewer instructions
- Public preview-video URL
- Launch request submission
- Per-carrier launch status and action-required messages

### Production Activation

After launch:

- Enable production sending
- Apply rate and spending limits
- Enable capability checks
- Enable approved fallback rules
- Activate usage billing
- Monitor delivery, complaints, failures, and opt-outs

## API implementation order

### Management operations

1. Create a brand
2. Create an agent
3. Update the agent profile
4. Add and manage testers
5. Submit and check verification
6. List launchable carriers
7. Submit launch requests
8. Check launch status

### Messaging operations

1. Check recipient capabilities
2. Send text
3. Send a rich card
4. Send a carousel
5. Send media and PDF content
6. Send suggested replies and actions
7. Revoke an undelivered message
8. Receive inbound messages
9. Process sent, delivered, read, and interaction events

## Portal implementation order

1. RCS Setup and agent onboarding
2. Test-message facility
3. Send RCS composer
4. Webhook and event processing
5. RCS Inbox
6. Reports
7. Usage billing and Payments
8. Public API

## First technical milestone

The first end-to-end milestone is:

> Create one client brand and agent, invite an RCS-enabled test device, send a
> text message and rich card, and receive delivery and read events.

Campaigns and an advanced rich-card builder should be developed only after
this end-to-end integration is proven.

