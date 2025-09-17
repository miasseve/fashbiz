"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import ConsignorForm from "./ConsignorForm";
import StoreForm from "./StoreForm";

const RegisterForm = () => {
  const [selectedTab, setSelectedTab] = useState("consignor");

  useEffect(() => {
    setSelectedTab(selectedTab);
  }, [selectedTab]);

  return (
    <section className="min-h-screen bg-fash-gradient">
      <div className="md:max-w-[100%] mx-auto min-h-screen">
        <div className="sm:flex w-full gap-5 justify-between relative h-full min-h-screen">
          <div className="sm:flex justify-end items-center  sm:p-4 lg:p-0  p-8 sm:p-0 sm:min-h-screen w-full sm:w-[50%]">
            <div className="w-100% md:w-[430px] sm:pr-[2rem] lftlogin">
              <div className="w-full text-center">
                <div className="icon-text text-black relative">
                  <Link href="/">
                    <img src="/fashlogo.svg" className="w-[37%] mb-[53px]" />
                  </Link>
                </div>
              </div>

              <div className="lg:pb-[5rem] pb-[5rem]">
                <div className="">
                  <div className="text-[54px] font-bold uppercase leading-[60px] mb-[30px] text-[#06cb03]">
                    Sell instantly
                  </div>

                  <p className="text-[18px] font-semibold text-black m-0 ">
                    Choose your role to get started:
                    </p>
                   <p className="mb-6"> <span className="font-semibold">Store</span> – Ideal for
                    businesses managing their own inventory.
                    </p>
                    <p className="mb-10"><span className="font-semibold">Consignor</span> – Great for
                    sellers who want to list items on behalf of others.
                    </p>
                </div>

                <div className="w-1/2">
                  <Link href="/login" className="login-btn text-base">
                    LOGIN
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="sm:w-[50%] flex justify-center items-center pt-8 sm:pt-0">
            <div className="text-center m-auto md:w-[80%] w-[100%] rounded-[8px] p-4">
              {/* <div className="text-[1.5rem] font-bold">Welcome</div> */}
              <div className="text-[24px] font-bold  leading-[4.2rem] mb-[1.5rem]">
                Sign Up
              </div>

              <Card className="w-full max-full">
                <CardBody className="tabbutton p-[30px]">
                  <Tabs
                    fullWidth
                    aria-label="Register Tabs"
                    className="h-[35px]"
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => {
                      setSelectedTab(key);
                    }}
                  >
                    <Tab key="store" title="Store">
                      <StoreForm />
                    </Tab>
                    <Tab key="consignor" title="Consignor">
                      <ConsignorForm />
                    </Tab>
                  </Tabs>
                </CardBody>
              </Card>
              <div className="text-[1.5rem] text-white text-center mt-4 leading-[2rem] ">
                Already have an account ?{" "}
                <Link href="/login" className="hover:underline text-[#6e482d]">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    // <section className="min-h-screen md:pt-[8rem] pt-[5rem] pb-[5rem]">
    //   <div className="md:max-w-[100%] md:px-[20px] 2xl:max-w-[1100px] mx-auto px-[15px] 2xl:px-20">
    //

    //       <div className="lg:w-[400px] w-[100%]  lg:absolute  right-0 top-0">
    //         <div
    //           className="text-center m-auto w-[300px] rounded-[8px] p-4"
    //           style={{
    //             backgroundImage: "url('/bg-img.png')",
    //             backgroundSize: "cover", // Ensures the image covers the container
    //             backgroundPosition: "center", // Centers the image
    //           }}
    //         >
    //           <div className="text-[1.5rem] font-bold text-white mb-[4rem]">
    //             Hi Welcome
    //           </div>
    //           <div className="text-[3.25rem] font-bold text-white leading-[4.2rem] mb-[2rem]">
    //             Register
    //           </div>

    //           <Card className="w-full max-w-md">
    //             <CardBody>
    //               <Tabs
    //                 fullWidth
    //                 aria-label="Register Tabs"
    //                 selectedKey={selectedTab}
    //                 onSelectionChange={(key) => {
    //                   setSelectedTab(key);
    //                 }}
    //               >
    //                 <Tab key="store" title="Store">
    //                   <StoreForm />
    //                 </Tab>
    //                 <Tab key="consignor" title="Consignor">
    //                   <ConsignorForm />
    //                 </Tab>
    //               </Tabs>
    //             </CardBody>
    //           </Card>

    //           <div className="text-[1.5rem] text-white text-center mt-4 leading-[2rem] ">
    //             Already have an account ?{" "}
    //             <Link href="/login" className="hover:underline text-[#6e482d]">
    //               Login
    //             </Link>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </section>
  );
};

export default RegisterForm;
