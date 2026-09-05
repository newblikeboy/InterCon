# InterCon fixes — explained simply

The local project now contains fixes for the major bugs found in the review. **It is not yet a fully verified commercial release.** These changes have not been deployed. Live payment, WhatsApp, email, Redis, and production-load checks are still needed.

Scheduled campaigns and automatic chatbot replies have **not** been implemented. The application now tells the truth about that limitation: it refuses to activate them, and the website labels them as planned features. Immediate bulk WhatsApp sending remains available.

## What changed

Follow-up: the [inbox realtime explanation](INBOX_REALTIME_2026-09-06.md) covers the missing delivery-status notification, the authenticated WebSocket implementation, security checks, and deployment requirements. That focused update includes newer verification results than this initial review-fix report.

The numbers below match the [original plain-language findings](PROJECT_REVIEW_PLAIN_LANGUAGE_2026-09-06.md).

| Finding | What the fix means for a business owner | Current position |
| --- | --- | --- |
| 1. Updates reaching the wrong business | A phone-name update now targets only the business that owns the notification. | Fixed; tested with separate businesses. |
| 2. Login protection could be bypassed | Changing fake keys or cookies no longer gives someone unlimited login attempts. Both the network address and account identifier have limits. | Fixed; the bypass test now gets blocked. |
| 3. Blocked contacts could become eligible again | Sending to a phone number cannot silently remove its existing block or rewrite its consent. | Fixed; tested. |
| 4. Waiting messages ignored later changes | Just before sending, the worker checks whether the contact is still eligible, the business is active, the plan is valid, and the sending phone is still connected. | Fixed; block, suspension, and expiry tested. |
| 5. Opening checkout removed paid access | Choosing another plan opens a separate payment order. Your existing subscription remains in place while you decide whether to pay. | Fixed; tested. |
| 6. A successful payment could be lost | Each checkout has its own record. Payment notifications and a background checker can activate access even if the customer closes the browser. A repeated confirmation cannot add the same payment twice. | Fixed locally; payment notification setup and the new billing worker are required. |
| 7. Templates vanished during refresh | The app reads every page of templates before deciding that a template disappeared. A failed second page leaves existing approvals intact. | Fixed; multi-page and failure tests passed. |
| 8. Long chats hid the newest messages | The inbox opens the newest messages and offers “Load older messages.” Fetching a chat no longer automatically marks unseen messages as read. | Fixed; a 205-message chat was tested. |
| 9. Missing database safeguards | Startup checks all declared database indexes, including the rules preventing duplicate contacts, payments, and message batches. Conflicting existing data stops the migration for review; nothing is automatically deleted. | Tested on a fresh disposable database. Existing production data still needs migration review. |
| 10. A connection could look successful when it was not | The provider must confirm that the selected phone belongs to an accessible WhatsApp account, and event subscription must succeed before those details are saved. | Fixed; wrong-phone and failed-subscription tests passed. Real Meta onboarding remains to be checked. |
| 11. A storage error could send a message twice | After WhatsApp accepts a message, a local bookkeeping failure cannot put it back in the sending queue. An unclear result is flagged for review. | Fixed; bookkeeping failure tested. |
| 12. Outdated spreadsheet software | Both the server dependency and the browser spreadsheet reader were updated. Other reported dependency vulnerabilities were also addressed. | Production dependency audit: zero known vulnerabilities at verification time. |
| 13. Renewing early lost paid days | New paid time is added after the current paid-through date. Month-end renewals are handled correctly. The billing screen now allows renewal and shows payment history. | Fixed; tested. |
| 14. Live updates stopped between servers | Background workers can now notify browser connections through Redis, rather than only within their own process. | Code and simulated shared-transport test passed. Real multi-server Redis testing remains. |
| 15. Late notifications moved things backward | A late “sent” notification cannot replace “read.” Older incoming messages no longer replace a newer conversation preview or shorten its reply window. Duplicate incoming notifications count once. | Fixed; tested. |
| 16. CSV files mixed up contact details | Names containing commas and values spanning multiple lines are imported correctly. Unfinished quotation marks are rejected. Import errors are displayed instead of only showing a skipped count. | Fixed; browser checks passed. |
| 17. Larger lists silently stopped | Contacts, media, conversations, and group members have page cursors. The customer portal reads all pages for its existing lists and pickers. | Fixed; 501 contacts tested in the browser. Very large-account performance still needs measurement. |
| 18. Retrying bulk sends created duplicates | Each bulk request gets a saved reference. A retry returns the original batch. The batch record and queued messages are saved together, so a partial save cannot leave half a batch. | Fixed; simultaneous retries and rollback tested. |
| 19. Campaigns and chatbots appeared operational | The server now rejects activation/scheduling instead of claiming that unfinished features are running. The website no longer includes them in current paid access. | Misleading behavior corrected; feature execution remains unfinished. |
| 20. Public placeholder admin page | The admin page now requires a separately granted platform-administrator permission and shows real database records. Its HTML is outside the public file directory. The old placeholder menus were replaced by the implemented dashboard. | Protected read-only dashboard implemented; access tests passed. Broader administrative workflows are not implemented. |
| 21. Keyboard and login usability problems | Dialogs keep keyboard focus inside and restore focus when closed. Password recovery is available. “Remember me” now controls whether the login cookie persists; an unchecked login has a 12-hour token. | Tested locally. Real reset-email delivery and a broader accessibility review remain. |
| 22. Broken navigation | Only real portal sections can be opened. Invalid section names cannot hide the whole interface. Browser Back restores earlier sections. | Fixed; browser checks passed. |
| 23. Logout hid failures | If logout fails, the app says the user is still signed in and stays on the page so they can retry. | Fixed; failed-request browser check passed. |
| 24. Monitoring consumed growing memory | Unknown URLs share a fixed monitoring category instead of creating a permanent entry for every different URL. | Code corrected and syntax checked. Production traffic behavior remains unmeasured. |

## Additional customer-facing improvements

- Blocked-number and opt-out screens now show actual contacts and allow a number to be suppressed with a reason. Suppression changes are recorded. Restoring a suppressed contact requires a fresh consent statement and evidence in the contact editor.
- The landing page no longer publishes the unverified business/message totals, uptime claim, or customer testimonials that were in the supplied project. Add those only when the business has supporting evidence and permission to publish them.
- Customer and admin assets have updated cache versions so browsers can receive the changes.

## What was checked

- `npm test`: **34 tests passed**, including tests against a disposable local MongoDB replica set. Provider requests and email delivery were simulated.
- `npm run check:ui`: **24 recorded browser checks passed**, including responsive customer views at 1440, 390, and 320 pixels. Admin layout was also checked at mobile widths. These used Chrome and simulated API responses.
- `npm run check`: **106 JavaScript files passed** syntax checking.
- `npm audit --omit=dev --json`: **zero known production dependency vulnerabilities**.
- `git diff --check`: passed.

Browser evidence: [check results](review-2026-09-06/fixes/ui-checks.json), [mobile inbox](review-2026-09-06/fixes/inbox-mobile.png), [password recovery](review-2026-09-06/fixes/password-recovery-mobile.png), and [admin dashboard](review-2026-09-06/fixes/admin-mobile.png).

## What still stands between this and launch

The next environment must have the new database indexes, the billing worker, a configured Razorpay webhook secret, working email delivery, and explicitly granted administrator access. Real Meta onboarding, payment recovery, Redis delivery across servers, backup restoration, and realistic traffic must be tested there. Safari/Firefox and assistive-technology testing are also still outstanding.

The existing bulk-message screen loads the complete contact selection into the browser. That removes the hidden cap, but it is not evidence that accounts with tens of thousands of contacts will perform well. Server-side selection and rendering only visible rows may be needed at that scale.

Payment refunds/disputes, advanced admin operations, scheduled campaigns, and chatbot execution are outside the implemented capability set. Older checkout details already overwritten before these changes cannot be reconstructed from the current tenant record alone; those require comparison with provider records.

See the [rollout instructions](PRODUCTION_ROLLOUT_2026-09-06.md) for the concrete configuration and verification steps. Passing local tests establishes the tested behaviors; it does not establish that every possible project bug has been found.
