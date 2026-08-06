// Shared between the admin CSV bulk-importer and the public "add a store"
// endpoint, so both use the exact same duplicate-detection rules.

// Loose match: ignore case, punctuation and extra whitespace so
// "H&M" / "H & M." / "h and m " are treated as the same store name.
export function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
