import React from "react";
import Profile from "./Profile";
import { getUser } from "@/actions/authActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
};

const Page = async () => {
  const response = await getUser();
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error("Failed to fetch user profile");
  }
  const user = JSON.parse(response.data);

  // Check if user has a paid webstore/plugin add-on or related subscription
  let hasWebstoreAccess = false;
  const session = await auth();
  if (session?.user?.id) {
    try {
      await dbConnect();
      const webstoreOrPluginPurchase = await AddOnPurchase.findOne({
        userId: session.user.id,
        status: "paid",
        addOns: { $in: ["webstore", "plugin"] },
      }).lean();
      if (webstoreOrPluginPurchase) hasWebstoreAccess = true;
    } catch (error) {
      console.error("Error checking webstore add-on:", error);
    }
  }
  // Also true if user has a Webstore subscription type
  const subType = user?.subscriptionType?.toLowerCase() || "";
  if (subType.includes("webstore") || subType.includes("plugin") || subType.includes("plug") || subType === "pro" || subType === "business") {
    hasWebstoreAccess = true;
  }

  return <Profile user={user} stripeResponse={stripeResponse} hasWebstoreAccess={hasWebstoreAccess} />;
};

export default Page;
