# Safety & security checklist (§7)

Part of the `kodion-create-spec` skill. Every spec's §7 checks **all 16 areas**:
- **Areas that apply** get a row: area + what we need, in plain words.
- **Every other area** goes in one "Not involved" line, with a short reason, e.g. `**Not involved (checked):** login (public page) · payments (none)`.

How deep each answer goes depends on the Risk level (see `risk-matrix.md`, section 3).

| # | Area | What to think about | Example answer |
|---|---|---|---|
| 1 | User input / forms | Required fields, max length, wrong format, file type and size, double submit | "Email is required and must look like an email. Max 200 characters." |
| 2 | Showing text safely | Text from users or admins is never run as code | "Names are always shown as plain text." |
| 3 | Login & permissions | Who can see or do this, and what everyone else sees | "Only admins see the Delete button. Others don't see it at all." |
| 4 | Personal data & consent | What personal data is shown or kept, who can see it, and whether we have permission | "Phone numbers are shown only to the account owner." |
| 5 | Legal / honesty | Reviews, prices, claims, terms, consent wording | "Quotes need written permission from each person." |
| 6 | Secrets & keys | No passwords or keys visible to users or in the page | "The payment key is never sent to the browser." |
| 7 | Stored data | Is anything new saved? What happens to existing records? Can it be undone? | "Existing users have no phone number. They see an empty field." |
| 8 | Payments & money | Wrong amounts, double charges, refunds, test mode | "A second click while paying does nothing." |
| 9 | Deleting anything | Confirm step, undo, who can do it, what else is deleted with it | "Asks 'Are you sure?'. Deleted accounts can be restored for 30 days." |
| 10 | Performance | Page speed, very long lists, slow connections | "Shows 20 items at a time, with 'Load more'." |
| 11 | Mobile & browsers | Phone sizes, supported browsers | "Works on a 375 px phone and current Chrome, Safari, Firefox, Edge." |
| 12 | Accessibility | Keyboard, screen reader, contrast, motion | "Every button works with a keyboard and has a visible outline." |
| 13 | SEO | Page titles, indexing, links, structured data | "Page title is 'Pricing – Bluespond'." |
| 14 | Breaking other features | What else could be affected by this change | "The booking demo must behave exactly as before." |
| 15 | Errors & logging | The user never sees a crash, errors are recorded, and messages are helpful | "If saving fails: 'Couldn't save. Please try again.' The error is logged." |
| 16 | Rollback | How we undo it if something goes wrong after release | "Switch the section off and redeploy." |
