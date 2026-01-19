"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import ConsignorForm from "./ConsignorForm";
import StoreForm from "./StoreForm";
import BrandForm from "./BrandForm";
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
                <div className="icon-text text-black relative pb-[2rem]">
                  <Link href="/">
                    <img src="/reelogo.png" className="w-[92px] py-[12px]" />
                  </Link>
                </div>
              </div>

              <div className="lg:pb-[5rem] pb-[5rem]">
                <div className="">
                  <div className="text-[54px] font-bold uppercase leading-[60px] mb-[30px] text-[#06cb03]">
                    14 DAYS FREE TO SELL INSTANTLY
                  </div>

                    {/* <p className="text-[18px] font-semibold text-black m-0 ">
                     Your trusted marketplace to sell with ease
                    </p> */}
                    <p className="text-[18px] font-normal text-black m-0 mb-[40px]">
                    Trouble logging in?{" "}
                    <Link href="/contact-support" className="underline">
                      Contact support
                    </Link>
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
                    <Tab key="brand" title="Brand">
                      <BrandForm />
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
