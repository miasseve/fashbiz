import React from "react";
import Profile from "./Profile";
import { getUser } from "@/actions/authActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { auth, computeHasWebstoreAccess } from "@/auth";
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

  const hasWebstoreAccess = await computeHasWebstoreAccess(user?._id, user?.subscriptionType);

  return <Profile user={user} stripeResponse={stripeResponse} hasWebstoreAccess={hasWebstoreAccess} />;
};

export default Page;
