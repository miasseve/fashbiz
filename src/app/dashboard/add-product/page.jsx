import React from "react";
import Main from "./Main";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
import { checkStripeIsConnected } from "@/actions/authActions";

export const metadata = {
  title: 'Add Product'
}

const page = async () => {
  const session = await auth();
  const response = await getUserProductCount();
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error(response.error);
  }
  
  // if(session?.user?.isActive === false){
  //   return (
  //     <div className="flex flex-col justify-center items-center my-[10rem] mx-auto gap-[17px] pb-20">
  //       <p className="text-white text-center italic font-bold">
  //         *Your Subscription Plan is expired. Please upgrade your plan.
  //       </p>
  //     </div>
  //   );
  // }
  
  return <Main user={session.user} productCount={response.count} stripeResponse={stripeResponse}/>;
};

export default page;
