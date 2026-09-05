# InterCon review explained in plain language

**Historical review snapshot:** the findings below describe the project before implementation. See [the fix report](FIXES_PLAIN_LANGUAGE_2026-09-06.md) for current status and remaining limitations.

**The main finding: InterCon looks promising, but it needs important fixes before a broad launch to paying customers.** A commercial product must reliably protect each business's information, handle payments correctly, deliver the right messages, and make its advertised features work.

Below are the same 24 findings from the [technical review](PROJECT_REVIEW_2026-09-06.md), explained with everyday examples. Examples describe what the faults could cause; they are not claims that real customers have already been affected. Some issues were reproduced in local tests, while others were identified by reading the code. Live payments, WhatsApp delivery, and the production database were not tested.

**Issues to address before launch**

1. **One business's name update could change another business's information.**

   When WhatsApp tells InterCon that a business's displayed name has changed, InterCon should update only that business. One part of the code can lose the instruction identifying which business to update. For example, an update intended for Shop A could affect Shop B. Each update needs a reliable check that it belongs to the correct business.

2. **Someone can get around the limit on login attempts.**

   A login page should slow down someone who keeps trying passwords. InterCon counts attempts, but a person can change an unverified label on their requests and be counted as a different requester each time. This makes automated password guessing easier; it does not mean the attacker automatically gains access. The limit needs to rely on information the requester cannot freely invent.

3. **A blocked customer can accidentally be made eligible for messages again.**

   Suppose you block a number or record that a customer no longer wants messages. When another system asks InterCon to send to that phone number and says it has permission, InterCon can overwrite the existing block. The customer could then receive unwanted messages. A normal send request should preserve the block; removing it should require a separate, deliberate action.

4. **Messages waiting to be sent do not get a final permission check.**

   Imagine a message joins the waiting list at 10:00, and you block that customer at 10:05. When the message is sent at 10:10, the sender does not check whether the customer was blocked in the meantime. It also misses changes such as a suspended business account or an expired paid plan. InterCon needs to check the current situation immediately before sending.

5. **Opening a payment screen can switch off a plan you already paid for.**

   A business with an active subscription selects another plan to look at checkout. InterCon immediately changes the account to “payment pending,” even though the new payment has not happened. Closing checkout does not restore the previous active subscription. Customers should keep the access they already purchased until a successful payment changes their plan.

6. **A customer could pay successfully but still have no active plan.**

   InterCon relies on the payment page sending a confirmation back after payment. If the customer closes the tab, loses connection, or opens another checkout before finishing the first, that confirmation can be lost or rejected. InterCon needs to keep a record of every payment order and independently check payment confirmations from the payment provider. A customer should not have to keep a particular browser tab open to receive what they paid for.

7. **Approved message templates can become unavailable by mistake.**

   Templates are the reusable messages approved for sending through WhatsApp. InterCon reads only the first page of the list from Meta, containing up to 100 templates. It can then treat templates on later pages as if they no longer exist and disable them locally. It needs to read the complete list before deciding that any template has disappeared.

8. **Busy conversations can hide the newest customer messages.**

   In a test conversation with 205 messages, InterCon displayed the first 200 and left out the five newest ones. It also cleared the unread count, so the user could believe there was nothing new to read. That could cause missed orders or unanswered support requests. The inbox should show the latest messages first and let users load older history when needed.

9. **A new installation can be missing important rules against duplicate records.**

   A database needs rules such as “do not create the same contact twice for this business” and “do not record the same incoming message twice.” Several rules are described in the project, but its setup process does not create all of them. A fresh installation can therefore behave differently from an older database where someone added those rules manually. Setup needs to install and verify the complete set. The existing production database was not inspected, so this does not establish that its rules are missing.

10. **A WhatsApp account can be marked as connected without enough checking.**

    InterCon accepts identifying numbers for a WhatsApp Business account and phone, but does not always confirm that the person connecting them has access to both or that they belong together. It can save them even after part of the connection process fails. This can produce a misleading “connected” state and creates an account-ownership risk. InterCon should confirm access with Meta before attaching those details to a business. No takeover of a live account was attempted or demonstrated.

11. **A message might be sent twice if saving the result fails.**

    WhatsApp may accept a message successfully, but InterCon may then have trouble recording that success in its own database. The current error handling can put the message back on the waiting list to send again. It is like posting a parcel twice because the first receipt failed to print. InterCon needs to retry saving the result without automatically repeating the send.

12. **Some third-party software used by the project has known security weaknesses.**

    The dependency check found five affected software packages. One is the tool that reads uploaded spreadsheets. A specially prepared file could make that reader misbehave or become unresponsive. This does not mean ordinary Excel files are dangerous, or that every reported weakness can be exploited here. The affected packages need attention, including the spreadsheet reader actually delivered to customers' browsers. The technical report contains the advisory links and details.

**Other bugs and unfinished parts**

13. **Changing a plan can throw away time the customer already paid for.**

    Suppose a business still has 90 days left and purchases a different one-month plan. The code calculates the new end date from today, rather than preserving or crediting the remaining time. In a local activation test, roughly 90 remaining days became one month. Plan changes need an explicit policy for unused time or credit, reflected clearly in checkout.

14. **“Live” inbox updates are not fully connected behind the scenes.**

    One part of InterCon receives WhatsApp updates, while another keeps the browser connected. When those parts run as separate programs, the first cannot pass an instant notification to the second through the current design. The browser's regular background checks can eventually pick up new messages, but updates may be delayed. These programs need a shared way to pass notifications to one another.

15. **Message status can go backward.**

    A message may correctly show “Read,” then change back to “Sent” when an older update arrives late. That happened in a local test. Users could wrongly think the customer has not read the message. InterCon needs to recognize older updates and avoid replacing newer information with them.

16. **Contact imports can misread normal names and put information in the wrong columns.**

    A CSV is a spreadsheet-style text file. A valid name such as “Doe, Jane” includes a comma, and the current importer incorrectly treats that comma as the start of another column. In the browser test, part of the name became the phone number, and the phone number became the city. The importer needs proper handling of quoted text and should explain which rows failed and why.

17. **Some contacts appear to disappear once the list grows.**

    You can import more than 100 contacts, but the contact list and individual recipient picker load only 100. Searching that picker cannot find contacts it has not loaded, and “Select all contacts” selects only the loaded subset. The missing contacts are not necessarily deleted; they are inaccessible through that screen. The interface needs a way to search all contacts and move through the complete list. Group sending can include more contacts, so this is not a universal limit of 100 recipients per send.

18. **Retrying a bulk send can queue the entire audience twice.**

    You submit a message to many customers, but your connection drops before the success message appears. You try again, reasonably believing the first attempt failed. InterCon currently treats that retry as a new batch, even if the first batch was already saved. Each confirmed bulk action needs a reference that lets InterCon recognize retries and return the original result.

19. **Campaign scheduling and automatic replies are not complete features yet.**

    The project can save campaign or automation details and change their status labels. However, the code that should run a campaign at its scheduled time or trigger an automatic reply is missing. Saving something as “scheduled” or “active” does not make it happen. Direct bulk sending is a separate implemented feature. The unfinished features need to be completed and tested, or clearly excluded from the paid offering.

20. **The admin panel mostly describes tools instead of providing them.**

    Clicking areas such as Customers or Billing shows explanations of what an administrator will eventually be able to do, rather than working management tools. These static pages can also be opened without signing in; this review did not demonstrate exposure of private customer records because those pages do not load such records. A display bug leaves the main menu visible above a selected detail screen. The panel needs real functions, appropriate access checks, and working page switching.

21. **Some login controls are confusing or do not work as expected.**

    The “Remember me” checkbox does not change how long the login is remembered. There is no password-reset flow for someone who forgets their password. Keyboard users can also move behind the login popup while it is still open, and “Need help?” points to content underneath that popup. These controls need to do what their labels promise, with a clear path for recovering access.

22. **Certain page links can leave the main area blank.**

    The portal sometimes mistakes the name of an individual page element for the name of a complete screen. Opening a URL with one of those names can hide all the actual screens. This was reproduced locally. InterCon should accept only valid screen names and fall back to a useful page for other links. Normal navigation should also allow the browser's Back button to retrace the user's steps.

23. **Logout can look successful even when the session remains active.**

    If the server rejects a logout request, the interface still sends the user to the homepage. Because the session is still active, the homepage can immediately send them back into their account. This is confusing, especially on a shared computer. The interface should confirm logout succeeded or clearly explain the failure and offer a retry.

24. **The system's own request statistics can keep consuming more memory.**

    InterCon keeps a separate statistics entry for many different page addresses people request, including addresses that do not exist. Someone repeatedly requesting new made-up addresses can cause that list to keep growing. Over time, this can increase memory use and affect performance. Unknown addresses should be grouped together, and the number of stored statistics entries should be limited.

**What the UI/UX assessment means for a business owner**

The pages have consistent colors, cards, and navigation. The sampled screens fitted desktop and small mobile widths without sideways page scrolling. These are useful strengths, but the checks mostly used empty lists and sample data. Screens with large real lists, long names, active conversations, and payment errors still need testing.

For a paying customer, the next step should always be obvious. A new user should be guided through connecting WhatsApp, activating a plan, importing contacts, creating a template, and sending a test message. If a screen has no contacts or templates, it should provide a button to add them. Technical account identifiers should not dominate the normal setup experience.

Features marked “Coming soon” should be clearly identified before someone clicks into them or buys a plan expecting to use them. Buyers also need clear explanations of charges, plan changes, payment history, and how to get help. Claims about customer numbers, delivered messages, uptime, and support availability should be backed by business records; this code review could not verify those claims.

**What to fix first**

- **Protect accounts and customer choices:** prevent updates crossing between businesses, close the login-limit bypass, verify WhatsApp account ownership, and preserve blocks and opt-outs.
- **Protect payments and messaging:** retain purchased access, recover successful payments, prevent duplicate sends, and show the latest customer messages.
- **Complete the customer experience:** finish promised features and admin tools, add password recovery, fix imports and navigation, and make keyboard use dependable.
- **Then verify a real launch setup:** test with separate background programs, a properly configured database, payment test accounts, WhatsApp test flows, and populated desktop/mobile screens.

The existing automated checks passed, but they cover a small portion of what customers will do. They are a useful starting point; the issues above explain why further fixes and testing are needed before commercial launch.
