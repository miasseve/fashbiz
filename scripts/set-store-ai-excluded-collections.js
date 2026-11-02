/**
 * Sets which of a store's Shopify collections the AI must never be offered —
 * a shop's brand categories and its catch-all buckets ("all products", "our
 * favourites", "archive").
 *
 * There is deliberately no screen for this (task #546 was quoted without one),
 * so it is set by hand per store, the same way a store's plan flags are. The
 * store owner can still choose an excluded collection by hand in the upload
 * form; only the model's list is filtered.
 *
 * Collections are identified by their Shopify GID, never by title or handle:
 * titles are not unique (one live store has two collections both titled
 * "Jakker") and handles contradict their contents on a real store (the PRADA
 * category's handle says "skjorter"). Get the ids from, logged in as an admin:
 *
 *   GET /api/admin/shopify/collections?userId=<store owner's id>
 *
 * Usage:
 *   node --env-file=.env scripts/set-store-ai-excluded-collections.js \
 *     --domain <shop>.myshopify.com --ids <gid>,<gid>,... [--add] [--dry-run]
 *
 *   --domain    the store's myshopify.com domain (ShopifyStore.storeDomain)
 *   --ids       comma-separated Shopify collection GIDs
 *   --add       merge with whatever is already set, instead of replacing it
 *   --list      show the store's current list and exit, changing nothing
 *   --clear     empty the list (ids not required)
 *   --dry-run   print what would change and write nothing
 *
 * Requires env vars: MONGODB_URI
 */

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

// Same shape the app validates against in src/lib/storeCollections.js, so a
// value this script writes can never be one the app would reject.
const COLLECTION_GID = /^gid:\/\/shopify\/Collection\/\d+$/;

function flagValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const domain = (flagValue("--domain") || "").trim().toLowerCase();
const rawIds = flagValue("--ids") || "";
const merge = process.argv.includes("--add");
const listOnly = process.argv.includes("--list");
const clear = process.argv.includes("--clear");
const dryRun = process.argv.includes("--dry-run");

if (!domain) {
  console.error("--domain <shop>.myshopify.com is required.");
  process.exit(1);
}
if (!listOnly && !clear && !rawIds) {
  console.error("--ids is required (or pass --list or --clear).");
  process.exit(1);
}

const shopifyStoreSchema = new mongoose.Schema({}, { strict: false });
const ShopifyStore =
  mongoose.models.ShopifyStore ||
  mongoose.model("ShopifyStore", shopifyStoreSchema);

async function run() {
  const ids = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const invalid = ids.filter((id) => !COLLECTION_GID.test(id));
  if (invalid.length) {
    console.error(
      `These are not Shopify collection ids:\n  ${invalid.join("\n  ")}\n` +
        `Expected the form gid://shopify/Collection/123456789. Nothing was written.`
    );
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const store = await ShopifyStore.findOne({ storeDomain: domain });
  if (!store) {
    console.error(`No ShopifyStore row for ${domain}. Nothing was written.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const current = Array.isArray(store.aiExcludedCollectionIds)
    ? store.aiExcludedCollectionIds
    : [];

  console.log(`\n${domain} currently excludes ${current.length} collection(s):`);
  current.forEach((id) => console.log(`  ${id}`));

  if (listOnly) {
    await mongoose.disconnect();
    process.exit(0);
  }

  const next = clear
    ? []
    : merge
      ? [...new Set([...current, ...ids])]
      : [...new Set(ids)];

  const added = next.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !next.includes(id));

  if (!added.length && !removed.length) {
    console.log("\nAlready set to exactly this. Nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`\nWould set ${next.length} collection(s):`);
  added.forEach((id) => console.log(`  + ${id}`));
  removed.forEach((id) => console.log(`  - ${id}`));

  if (dryRun) {
    console.log("\n--dry-run: nothing was written.");
    await mongoose.disconnect();
    process.exit(0);
  }

  store.aiExcludedCollectionIds = next;
  await store.save();

  console.log(
    `\nDone. ${domain}: ${added.length} added, ${removed.length} removed, ` +
      `${next.length} excluded in total.\n` +
      `This takes effect on the store's next upload — the exclusion list is read ` +
      `fresh each time and is not held in the collection cache.`
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
