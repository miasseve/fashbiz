import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import { subscriptionService } from "@/lib/subscriptionService";

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await dbConnect();
    const { action, priceId, paymentMethodId, referredBy } = await req.json();

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
