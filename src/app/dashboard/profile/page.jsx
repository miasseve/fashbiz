import React from "react";
import Profile from "./Profile";
import { getUser } from "@/actions/authActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { redirect } from "next/navigation";

const Page = async () => {
  const response = await getUser(); 
  const stripeResponse = await checkStripeIsConnected();
  
  if (response.status != 200) {
    throw new Error("Failed to fetch user profile");
    // redirect("/login");
  }
  const user = JSON.parse(response.data);
  return <Profile user={user} stripeResponse={stripeResponse}/>; 
};

export default Page;
