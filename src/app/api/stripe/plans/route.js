// ============= app/api/stripe/plans/route.js =============
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSubscriptionPlans } from "@/actions/stripePlans";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const subscriptionPlans = await getSubscriptionPlans();
    return NextResponse.json(subscriptionPlans);
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}