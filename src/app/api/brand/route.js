import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Update collect = true for this user
    const updatedAccount = await Account.findOneAndUpdate(
      { userId },
      { collect: true },
      { new: true }
    );

    if (!updatedAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Collect subscription activated successfully!",
        account: updatedAccount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("API ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
