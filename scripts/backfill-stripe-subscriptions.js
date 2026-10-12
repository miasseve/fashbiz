/**
 * Backfill Script: Populate stripeSubscriptionId on User documents
 * from their corresponding Subscription records.
 *
 * Usage: node --env-file=.env scripts/backfill-stripe-subscriptions.js
 *
 * Requires env vars: MONGODB_URI
 */

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const subscriptionSchema = new mongoose.Schema({}, { strict: false });
const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const subscriptions = await Subscription.find({
    stripeSubscriptionId: { $exists: true, $ne: null },
    userId: { $exists: true, $ne: null },
  });

  console.log(
    `Found ${subscriptions.length} Subscription documents with stripeSubscriptionId.`,
  );

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const sub of subscriptions) {
    const user = await User.findById(sub.userId);

    if (!user) {
      console.log(`  User not found for Subscription ${sub._id} (userId: ${sub.userId})`);
      notFound++;
      continue;
    }

    if (user.stripeSubscriptionId === sub.stripeSubscriptionId) {
      skipped++;
      continue;
    }

    await User.findByIdAndUpdate(sub.userId, {
      stripeSubscriptionId: sub.stripeSubscriptionId,
    });
    updated++;
    console.log(
      `  Updated: ${user.email || user._id} -> ${sub.stripeSubscriptionId}`,
    );
  }

  console.log(
    `\nDone! Updated: ${updated}, Skipped (already set): ${skipped}, User not found: ${notFound}`,
  );
  await mongoose.disconnect();
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
