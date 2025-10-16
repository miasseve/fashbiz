import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { subscriptionService } from "@/lib/subscriptionService";
 
export async function GET(req) {
  try {
    await dbConnect();
   
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
   
    if (!userId) {
      return NextResponse.json({ subscription: null });
    }
 
    // Get subscription from database and sync with Stripe
    const subscription = await subscriptionService.getUserSubscription(userId, true);
   
    return NextResponse.json({ subscription });
  } catch (err) {
    console.error("Get subscription error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}