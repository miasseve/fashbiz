import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE = "no-store, no-cache, must-revalidate";

export async function GET() {
  let session;
  try {
    session = await auth();
  } catch {
    // auth() throws when cookie can't be decrypted (e.g., AUTH_SECRET changed)
  }
  if (!session) {
    const res = NextResponse.json({ count: 0 }, { status: 200 });
    res.headers.set("Cache-Control", NO_CACHE);
    return res;
  }

  await dbConnect();

  const count = await Notification.countDocuments({
    userId: session.user.id,
    isRead: false,
  });

  const response = NextResponse.json({ count }, { status: 200 });
  response.headers.set("Cache-Control", NO_CACHE);
  return response;
}
