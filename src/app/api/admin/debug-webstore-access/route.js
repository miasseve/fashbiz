import dbConnect from "@/lib/db";
import User from "@/models/User";
import AddOnPurchase from "@/models/AddOnPurchase";
import { computeHasWebstoreAccess } from "@/auth";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

// Read-only diagnostic: shows exactly why a given account does or doesn't
// get hasWebstoreAccess, so a "Not active" report can be root-caused instead
// of guessed at (stale session vs. no qualifying subscription/add-on).
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return Response.json({ error: "Missing ?email=" }, { status: 400 });
  }

  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "_id email storename role subscriptionType subscriptionStart subscriptionEnd",
  );
  if (!user) {
    return Response.json({ error: "No user with that email" }, { status: 404 });
  }

  const addOnPurchases = await AddOnPurchase.find({ userId: user._id }).select(
    "addOns status totalAmount paidAt createdAt",
  );

  const hasWebstoreAccess = await computeHasWebstoreAccess(user._id, user.subscriptionType);

  return Response.json({
    email: user.email,
    storename: user.storename,
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionStart: user.subscriptionStart,
    subscriptionEnd: user.subscriptionEnd,
    hasWebstoreAccess,
    addOnPurchases,
  });
}
