import React from "react";
import SubscriptionPlans from "./SubscriptionPlans";
import { getUser } from "@/actions/authActions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const page = async () => {
  let user;

  try {
    const response = await getUser();
    
    // Handle different error cases
    if (!response) {
      throw new Error('No response from getUser');
    }

    if (response.status === 400) {
      console.error('Invalid user session');
      redirect("/login");
    }

    if (response.status === 404) {
      console.error('User not found in database');
      redirect("/login");
    }

    if (response.status === 500) {
      console.error('Internal server error');
      redirect("/login");
    }

    if (response.status !== 200) {
      console.error('Unexpected status:', response.status);
      redirect("/login");
    }

    if (!response.data) {
      throw new Error('Response data is empty');
    }

    // Parse the user data
    user = JSON.parse(response.data);

    if (!user || !user._id) {
      throw new Error('Invalid user object structure');
    }

  } catch (error) {
    console.error('Subscription page error:', {
      message: error.message,
      stack: error.stack
    });
    redirect("/login");
  }

  return <SubscriptionPlans user={user} />;
};

export default page;