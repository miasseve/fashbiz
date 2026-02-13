import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const result = await Notification.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
