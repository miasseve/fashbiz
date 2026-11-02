/**
 * Works out how a rule-driven Shopify collection can be populated by tagging
 * a product.
 *
 * Its own module, with no imports, because both sides of the feature need it:
 * `aiProductAnalysis` to decide what the model may be offered, and
 * `shopifyAction` to decide what gets written at save time. Those two answers
 * MUST agree — if they could drift, a collection would pass in the form and
 * then silently fail on Shopify, which is the failure this feature exists to
 * remove. Keeping it here also avoids an import cycle: `storeCollections`
 * already imports from `shopifyAction`.
 */


// Shopify splits a tag string on commas, so a rule condition containing one can
// never be satisfied by writing it as a single tag: "men, large" becomes two
// tags and NEITHER equals the condition. The product would silently miss the
// category the owner chose while gaining two junk tags that may pull it into
// other rule-driven collections — the worst outcome available here. Such a rule
// is refused outright rather than approximated.
const UNREPRESENTABLE_TAG = /,/;
const MAX_TAG_LENGTH = 255;

/**
 * Works out whether a rule-driven ("automated"/"smart") collection can be
 * populated by tagging the product, and with which tags.
 *
 * Shopify fills these collections itself from its rules and REJECTS a direct
 * `collectionAddProducts` write, so the only way a product lands in one is to
 * carry the tags its rules match. Rules can also be about other columns
 * (TITLE, TYPE, VENDOR, price...) which no tag can satisfy; those collections
 * can't be placed into at all and must therefore never be suggested.
 *
 * Deliberately **total and pure**: no I/O, and every shape of input — a missing
 * `rules`, a null `condition`, a lowercase `column`, an absent
 * `appliedDisjunctively` — returns a defined answer instead of throwing. The
 * same answer drives BOTH what the AI may be offered and what gets written at
 * save time; if those two could disagree, a category would pass in the form and
 * silently fail on Shopify, which is the exact failure this task exists to fix.
 *
 * @param {object|null|undefined} ruleSet  Shopify's `ruleSet` for a collection
 * @returns {null | { eligible: false, reason: string }
 *                 | { eligible: true, mode: "any"|"all", tags: string[], candidates: string[] }}
 *          `null` means "not rule-driven at all" (a manual collection) — the
 *          caller keeps using `collectionAddProducts` for those.
 */
export function tagRulesForCollection(ruleSet) {
  if (ruleSet === null || ruleSet === undefined) return null;

  const rules = ruleSet?.rules;
  if (!Array.isArray(rules) || rules.length === 0) {
    return { eligible: false, reason: "no readable rules" };
  }

  const allTagEquals = rules.every(
    (r) =>
      String(r?.column ?? "").toUpperCase() === "TAG" &&
      String(r?.relation ?? "").toUpperCase() === "EQUALS"
  );
  if (!allTagEquals) {
    return { eligible: false, reason: "rules are not all tag-equals" };
  }

  // Keep the merchant's exact spelling and case. Shopify matches tags
  // case-insensitively, but a store's own storefront filters are case-sensitive
  // (one store shows "t-shirt" and "T-shirt" as two separate filters), so the
  // condition is written exactly as they wrote it.
  const candidates = rules.map((r) => String(r?.condition ?? "").trim());
  const usable = candidates.filter(
    (c) => c !== "" && !UNREPRESENTABLE_TAG.test(c) && c.length <= MAX_TAG_LENGTH
  );

  // "any one rule matches" — one usable condition is enough.
  if (ruleSet.appliedDisjunctively === true) {
    if (usable.length === 0) {
      return { eligible: false, reason: "no rule condition can be written as a tag" };
    }
    // The first rule as Shopify returned it. Shopify's own admin lists a smart
    // collection's conditions in this order, so the choice is explainable to a
    // merchant as "the top condition on your own collection screen" rather than
    // being an arbitrary pick they can't predict.
    return { eligible: true, mode: "any", tags: [usable[0]], candidates };
  }

  // "all rules must match" — a partial write is worse than none: it adds tags
  // with side effects on other collections while still missing this one.
  if (usable.length !== candidates.length) {
    return {
      eligible: false,
      reason: "a rule condition can't be written as a tag and all rules must match",
    };
  }

  const deduped = [];
  const seen = new Set();
  for (const tag of usable) {
    const fingerprint = tag.toLowerCase();
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    deduped.push(tag);
  }

  return { eligible: true, mode: "all", tags: deduped, candidates };
}
