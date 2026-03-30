// ============= app/api/stripe/plans/route.js =============
import { NextResponse } from "next/server";
import { getSubscriptionPlans } from "@/actions/stripePlans";

export async function GET() {
  try {
    const subscriptionPlans = await getSubscriptionPlans();
    return NextResponse.json(subscriptionPlans);
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}