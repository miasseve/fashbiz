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
    <section className="min-h-screen md:pt-[10rem] pt-[5rem] pb-[5rem] bg-gradient-to-b from-[#FFF0F0] to-[#DD8081]">
      <div className="md:max-w-[100%] md:px-[20px] 2xl:max-w-[1100px] mx-auto px-[15px] 2xl:px-20">
        <div className="lg:flex w-full gap-5 justify-between">
          <div className="lg:w-[60%] w-[100%]  flex flex-col justify-between">
            <div className="w-full lg:w-[20%] h-30 text-center">
              <div className="icon-text text-black relative">
                <h1 className="text-[4.25rem] pl-[0rem] mb-8 lg:lg-0">
                  <img
                    src="/fashlogo.svg"
                    className="w-[120px] md:[200px] lg:m-0 m-auto"
                  />
                </h1>
              </div>
            </div>

            <div className="lg:pb-[5rem] pb-[5rem]">
              <div className="lg:pl-[5rem]">
                <div className="2xl:text-[6rem] lg:text-[5rem] md:text-[4rem] text-[4rem] text-center lg:text-left text-white 2xl:leading-[5rem] leading-[4rem] font-normal mb-[4rem] max-w-[100%]">
                  Sell <br></br> instantly
                </div>
              </div>
              <div className="text-center lg:text-right pr-[0] lg:pr-[8rem]">
                <Link
                  href="/login"
                  className="bg-white px-8 rounded-lg hover:bg-[#53f84b] transition duration-300 text-[1.2rem] text-left py-4 inline-block leading-[1.5rem]"
                >
                  LOGIN
                </Link>
              </div>
            </div>
          </div>

          <div
            className="h-full lg:w-[40%] w-[100%] m-auto rounded-[8px]"
            style={{
              backgroundImage: "url('/bg-img.png')",
              backgroundSize: "cover", // Ensures the image covers the container
              backgroundPosition: "center", // Centers the image
            }}
          >
            <div className="p-[1rem] 2xl:p-[2rem] gap-[27px] text-center m-auto max-w-[300px]">
              <div className="text-[1rem] font-bold text-white mb-[4rem]">
                Hi Welcome
              </div>
              <div className="text-[3.25rem] font-bold text-white leading-[4.2rem] mb-[2rem]">
                Register
              </div>

              <Card className="w-full max-w-md">
                <CardBody>
                  <Tabs
                    fullWidth
                    aria-label="Register Tabs"
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => {
                      console.log("Tab changed to:", key);
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
  );
};

export default RegisterForm;
