# Plan — Task #412: Redesign Link Inquiry email template to match leStores AI branding

**Spec:** `.claude/specs/412-redesign-link-inquiry-email-template.md` (Approved, Medium risk)
**Branch:** `feat/pricing-alignment` (already on it — do not create another)

## Context

When a customer submits the "Get it now" form on the pricing page, `POST /api/link-inquiry` calls `linkInquiry(...)`, which emails the team at `mia@le-stores.com`. Today that email is a plain black-and-white HTML table with no logo, no brand colour and no reply button — it reads like a test message. The task redesigns this one transactional email to look professional and on-brand, and updates its subject line. It is Medium risk because it is a live email to a real inbox: a broken template means lost webshop-connection inquiries, so nothing about delivery (recipient, reply-to, the data passed, the customer-facing failure path) may change.

## Scope

- **Change:** `src/mails/linkInquiry.js` — the HTML body and the subject line (both live inside this file).
- **Likely no change:** `src/app/api/link-inquiry/route.js` — it only validates and forwards `{ name, storeName, contactEmail, webshopUrl, message }`. The subject is built in `linkInquiry.js` from `storeName`, which is already passed, so the route should not need editing.
- **Do not touch:** any other template in `src/mails/`, any other API route.

## Design decisions (locked from spec §9)

- **Brand colours** from `DESIGN.md`: primary `#ca2356`, hover `#b80049`, page bg `#fff5f7`, surface `#ffffff`, foreground `#111827`, muted `#6b7280`, border `#e5e7eb`, accent `#fce7f0`.
- **Logo:** `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/images/fash.png` with `alt="leStores AI"` (same pattern as `forgotPassword.js`).
- **Reply button:** `mailto:${contactEmail}` (matches the existing `replyTo`).
- **Footer:** short brand footer + "leStores AI" sign-off (hardcoded brand name).

## Implementation (`src/mails/linkInquiry.js`)

Keep unchanged: transporter config, `from`, `to: "mia@le-stores.com"`, `replyTo: contactEmail`.

1. Subject: `New webshop connection request - ${storeName}`.
2. `esc()` helper escaping & < > " ' — applied to all customer values; `encodeURI` for the webshop href.
3. Table-based, inline-CSS, fluid max-600px body: crimson header + logo, white details card (5 labelled rows, email + URL links), pill Reply button (`mailto:`), brand footer. Empty: name → "—", message → "No message provided".

## Verification

1. `npm run lint` — no new errors.
2. `npm run build` — passes.
3. Render the generated HTML with a sample payload and check all 10 ACs (subject, header, details, empty-field, reply button, footer, inline CSS, 375px, conventions, `<b>hi</b>` literal). Real SMTP send on staging before go-live.

## Rollback

Revert `src/mails/linkInquiry.js` to restore the previous email.
