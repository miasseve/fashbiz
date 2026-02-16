import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE = "no-store, no-cache, must-revalidate";

function noCache(res) {
  res.headers.set("Cache-Control", NO_CACHE);
  return res;
}

export async function GET() {
  try {
    let session;
    try {
      session = await auth();
    } catch {
      // auth() throws when cookie can't be decrypted
    }
    if (!session) {
      return noCache(NextResponse.json({ count: 0 }, { status: 200 }));
    }

    await dbConnect();

    const count = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    return noCache(NextResponse.json({ count }, { status: 200 }));
  } catch (err) {
    console.error("Unread count API error:", err);
    return noCache(NextResponse.json({ count: 0 }, { status: 200 }));
  }
}
