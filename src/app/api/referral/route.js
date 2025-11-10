import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ReferralDetails from "@/models/Referral";
import SubscriptionPlans from "@/models/SubscriptionPlanDetails";
import StoreReferralCode from "@/models/StoreReferralCode";
import crypto from "crypto";
import User from "@/models/User";

const getStoreTag = (storeName) => {
  return storeName
    ?.replace(/[^A-Za-z0-9]/g, "") 
    ?.substring(0, 4)
    ?.toUpperCase() || "SHOP";
};

// Random 6-character alphanumeric code
const generateRandomCode = (length = 6) => {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .substring(0, length)
    .toUpperCase();
};

const generateReferralCode = (storeName, months = 6) => {
  const storeTag = getStoreTag(storeName);
  const durationTag = `${months}M`;
  const random = generateRandomCode(6);
  return `${storeTag}${durationTag}${random}`;
};

export async function POST() {
  try {
    await dbConnect();

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId);
    let existingReferral = await StoreReferralCode.findOne({ user_id: userId });
    if (!existingReferral) {
      const userStore = user?.storename;
      const referralCode = generateReferralCode(userStore, 6);
      existingReferral = await StoreReferralCode.create({
        user_id: userId,
        referralCode,
      });
    }
    const referralCode = existingReferral.referralCode;

    return NextResponse.json(
      {
        message: "Referral link created successfully",
        referralLink: referralCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Referral Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
