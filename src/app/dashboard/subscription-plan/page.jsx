// C:\Users\Admin\Desktop\React\NextJS\live\fashion-app\src\app\dashboard\subscription-plan\page.jsx
import React from "react";
import SubscriptionPlans from "./SubscriptionPlans";
import { getUser } from "@/actions/authActions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
const page = async () => {
  try {
    const response = await getUser();
    if (response.status != 200) {
      redirect("/login");
    }
  } catch (error) {
    redirect("/login");
  }

  const user = JSON.parse(response.data);

  return (
    // <h3>In Progress</h3>
    <SubscriptionPlans user={user} />
  );
};

export default page;
