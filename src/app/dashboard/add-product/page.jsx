import React from "react";
import Main from "./Main";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
import { checkStripeIsConnected } from "@/actions/authActions";
const page = async () => {
  const session = await auth();
  const response = await getUserProductCount();
  
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error(response.error);
  }
  
  return <Main user={session.user} productCount={response.count} stripeResponse={stripeResponse}/>;
};

export default page;
