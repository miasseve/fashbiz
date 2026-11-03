/**
 * Sets per-store Shopify settings that have no screen:
 *
 *   --default-location <gid>   the location (shop) that receives the stock of
 *                              new products. Get the ids from, logged in as an
 *                              admin: GET /api/admin/shopify/locations?userId=<id>
 *   --clear-location           back to "first active location"
 *   --size-in-title on|off     write the size into the title as "(Str. M)",
 *                              the way CPH Concept's own catalogue does it
 *   --list                     show the current settings and exit
 *   --dry-run                  print what would change and write nothing
 *
 * Usage:
 *   node --env-file=.env scripts/set-store-shopify-settings.js \
 *     --domain <shop>.myshopify.com [--default-location gid://shopify/Location/123] \
 *     [--size-in-title on] [--dry-run]
 *
 * Requires env vars: MONGODB_URI
 */

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

const LOCATION_GID = /^gid:\/\/shopify\/Location\/\d+$/;

function flagValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const domain = (flagValue("--domain") || "").trim().toLowerCase();
const location = flagValue("--default-location");
const clearLocation = process.argv.includes("--clear-location");
const sizeInTitleRaw = flagValue("--size-in-title");
const listOnly = process.argv.includes("--list");
const dryRun = process.argv.includes("--dry-run");

if (!domain) {
  console.error("--domain <shop>.myshopify.com is required.");
  process.exit(1);
}
if (location !== undefined && !LOCATION_GID.test(location)) {
  console.error(`"${location}" is not a Shopify location id (gid://shopify/Location/123). Nothing was written.`);
  process.exit(1);
}
if (sizeInTitleRaw !== undefined && !["on", "off"].includes(sizeInTitleRaw)) {
  console.error("--size-in-title takes on or off. Nothing was written.");
  process.exit(1);
}
if (!listOnly && location === undefined && !clearLocation && sizeInTitleRaw === undefined) {
  console.error("Nothing to set. Pass --default-location, --clear-location, --size-in-title or --list.");
  process.exit(1);
}

const shopifyStoreSchema = new mongoose.Schema({}, { strict: false });
const ShopifyStore =
  mongoose.models.ShopifyStore || mongoose.model("ShopifyStore", shopifyStoreSchema);

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const store = await ShopifyStore.findOne({ storeDomain: domain }).lean();
  if (!store) {
    console.error(`No ShopifyStore row for ${domain}. Nothing was written.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  if (store.isBaseStore) {
    console.error(`${domain} is the base store. These settings are for connected stores only.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`\n${domain} (${store.connectedVia || "manual"}, ${store.status || "connected"}):`);
  console.log(`  defaultLocationId: ${store.defaultLocationId || "(first active location)"}`);
  console.log(`  sizeInTitle:       ${store.sizeInTitle === true ? "on" : "off"}`);

  if (listOnly) {
    await mongoose.disconnect();
    return;
  }

  const set = {};
  if (location !== undefined) set.defaultLocationId = location;
  if (clearLocation) set.defaultLocationId = null;
  if (sizeInTitleRaw !== undefined) set.sizeInTitle = sizeInTitleRaw === "on";

  console.log("\nWill set:", set);
  if (dryRun) {
    console.log("--dry-run: nothing was written.");
    await mongoose.disconnect();
    return;
  }

  await ShopifyStore.updateOne({ _id: store._id }, { $set: set });
  console.log("Saved.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
