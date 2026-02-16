import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE = "no-store, no-cache, must-revalidate";

export async function GET(req) {
  let session;
  try {
    session = await auth();
  } catch {
    // auth() throws when cookie can't be decrypted (e.g., AUTH_SECRET changed)
  }
  if (!session) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", NO_CACHE);
    return res;
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

  const response = NextResponse.json({ notifications }, { status: 200 });
  response.headers.set("Cache-Control", NO_CACHE);
  return response;
}
