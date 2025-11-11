import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ReferralDetails from "@/models/Referral";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const { userId, referralCode } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    }

    // Mark user as active after successful payment
    await User.findByIdAndUpdate(userId, { isActive: true });

    // Update referral usage if exists
    if (referralCode) {
      const referralDet = await ReferralDetails.findOne({
        referredTouser_id: userId,
        referralCode,
      });

      if (referralDet) {
        referralDet.used = true;
        referralDet.usedAt = new Date();
        await referralDet.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
