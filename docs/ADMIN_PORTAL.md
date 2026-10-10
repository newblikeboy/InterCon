# InterCon business administration

Open `/admin/login` and sign in using an explicitly provisioned platform administrator account. Ordinary customer owners, admins and agents cannot access `/admin` or `/api/admin/*`. Administrative permissions are checked against the database on each request.

The overview shows customer workspaces, customer team members, active paid customers/users, expiring subscriptions, manual access grants and suspended workspaces. Payment reports use recorded payment amounts in minor currency units and display each currency separately. Captured revenue excludes records currently marked refunded or disputed. Estimated monthly recurring revenue normalizes active subscription prices over their purchased months; manual grants contribute no revenue. Date ranges use India time. The ledger does not record fees, tax or partial refunds.

Searchable, paginated records and CSV exports cover workspaces, users, payments, checkout attempts, message delivery, templates, webhooks and administrative activity. Exports include all matches and protect formula-like values and long phone numbers for Excel. Workspace details show members, subscription expiry, trial usage, WhatsApp connection metadata, contact statuses, delivery totals, template statuses, payments and recent admin changes. Tokens, passwords, payment signatures and webhook payloads are excluded from admin reports.

Administrative controls require a reason and save their before/after values in `PlatformAudit` within the same database transaction as the change:

- Suspend/reactivate customer workspaces. Suspension invalidates existing member sessions and stops sending through the shared workspace access guard.
- Disable/reactivate customer users or revoke their sessions. Administrator accounts and the acting administrator's workspace are protected.
- Grant manual plan access with an expiry date, or end current plan access. Grants do not charge the customer or create a payment. Ending plan access does not refund payments; remaining free allowance can still permit sending, so suspend the workspace when all sending must stop.
- Cancel queued or scheduled messages. Processing, accepted and uncertain deliveries cannot be cancelled or resent through this interface.
- Return failed/retrying webhook events to the worker queue.

System health reports the API process, MongoDB, optional Redis and database queue totals. Queue totals do not prove worker availability; message and webhook workers are separate processes.

## Account provisioning

Run `node src/scripts/createPlatformAdmin.js` and supply a JSON object with `email` and `password` over standard input. Do not put real credentials in source files, command arguments or documentation. Existing users retain their identity and customer workspace; their password is hashed, platform admin access is granted and previous sessions are revoked. New administrator accounts receive an internal workspace excluded from customer counts. There is no public endpoint for granting platform admin access.

## Verification

`npm test` includes administrator authorization, currency/revenue calculations, export sanitization, session revocation, protected accounts, transactional audit records, plan grants, message cancellation, webhook retry and account provisioning. `npm run check:ui` checks navigation, revenue views, workspace dialogs, controls, CSV downloads, error recovery and mobile layouts against intercepted APIs.
