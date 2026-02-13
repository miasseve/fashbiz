import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  let isRead = true;
  try {
    const body = await req.json();
    if (typeof body.isRead === "boolean") {
      isRead = body.isRead;
    }
  } catch {
    // No body or invalid JSON — default to marking as read
  }

  await Notification.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { isRead },
  );

  return NextResponse.json({ success: true, isRead }, { status: 200 });
}
