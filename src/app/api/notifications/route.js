import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  const notifications = await Notification.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("productId", "title images sku price")
    .lean();

  return NextResponse.json({ notifications }, { status: 200 });
}
