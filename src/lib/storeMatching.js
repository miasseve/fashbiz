// Shared between the admin CSV bulk-importer and the public "add a store"
// endpoint, so both use the exact same duplicate-detection rules.

import crypto from "crypto";

// Loose match: ignore case, punctuation and extra whitespace so
// "H&M" / "H & M." / "h and m " are treated as the same store name.
export function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// A "store" created without real login info (CSV import, a Discover user
// submitting a boutique that isn't listed yet, or an admin Add Store with
// the email left blank) is stubbed with an email on this internal-only
// domain instead of a real one — nobody has the password either. This is
// the single marker used everywhere to recognize that stub, including by
// registerUser() to "claim" it (take it over in place) instead of creating
// a duplicate account when the real owner signs up for real.
const UNCLAIMED_EMAIL_DOMAIN = "ree-unclaimed.internal";

export function makeUnclaimedEmail() {
  return `unverified-${crypto.randomUUID()}@${UNCLAIMED_EMAIL_DOMAIN}`;
}

export function isUnclaimedEmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith(`@${UNCLAIMED_EMAIL_DOMAIN}`);
}
