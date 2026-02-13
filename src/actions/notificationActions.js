"use server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";

export async function toggleSoldNotifications(enabled) {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "Not authenticated" };
    }
    await dbConnect();
    await User.findByIdAndUpdate(session.user.id, {
      soldNotifications: enabled,
    });
    return { status: 200 };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
