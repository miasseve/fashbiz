import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { subscriptionService } from "@/lib/subscriptionService";

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) return NextResponse.json({ subscription: null });

    const subscription = await subscriptionService.getUserSubscription(
      userId,
      true
    );
    return NextResponse.json({ subscription });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, action, priceId, paymentMethodId, referredBy } = await req.json();

    let result;

    if (action === "create") {
      result = await subscriptionService.createSubscription(
        userId,
        priceId,
        paymentMethodId,
        referredBy
      );
      return NextResponse.json({ success: true, subscription: result });
    }

    if (action === "change") {
      result = await subscriptionService.changeSubscription(userId, priceId);
      return NextResponse.json({
        success: true,
        message: "Plan updated",
        subscription: result,
      });
    }

    if (action === "cancel") {
      result = await subscriptionService.cancelSubscription(userId);
      return NextResponse.json({
        success: true,
        message: "Subscription will cancel at period end",
        subscription: result,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
