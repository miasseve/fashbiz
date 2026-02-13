import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  await dbConnect();

  const count = await Notification.countDocuments({
    userId: session.user.id,
    isRead: false,
  });

  return NextResponse.json({ count }, { status: 200 });
}
