import React from "react";
import SubscriptionPlans from "./SubscriptionPlans";
import { getUser } from "@/actions/authActions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const page = async () => {
  try {
    const response = await getUser();

    if (response.status !== 200) {
      console.error('Unexpected status:', response.status);
      redirect("/profile");
    }

    if (!response.data) {
      throw new Error('Response data is empty');
    }

    // Parse the user data
    const user = JSON.parse(response.data);

    if (!user || !user._id) {
      throw new Error('Invalid user object structure');
    }
    
    return <SubscriptionPlans user={user} />;
  } catch (error) {
    console.error('Subscription page error:', {
      message: error.message,
      stack: error.stack
    });
    redirect("/profile");
  }

};

export default page;