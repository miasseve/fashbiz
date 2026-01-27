"use client";
import React, { useEffect, useState } from "react";
import { getQRData } from "@/actions/accountAction";
import ConsignorQR from "./ConsignorQR";
import { Spinner } from "@heroui/react";
import { checkStripeIsConnected } from "@/actions/authActions";

const Consignor = ({ user }) => {  // Add user prop here
  const [qrData, setQrData] = useState(null);
  const [stripeResponse, setStripeResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoLimitReached, setDemoLimitReached] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qrResponse = await getQRData();
        const stripeData = await checkStripeIsConnected();

        if (qrResponse.status !== 200) {
          throw new Error(qrResponse.error);
        }

        setQrData(qrResponse.qrData);
        setStripeResponse(stripeData);

        if (stripeData?.data) {
          const parsedData = JSON.parse(stripeData.data);
          setIsDemo(parsedData?.mode === "demo");
          setDemoLimitReached(parsedData?.demoLimitReached || false);
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <ConsignorQR
      qrData={qrData}
      stripeResponse={stripeResponse}
      demoLimitReached={demoLimitReached}
      user={user}  
    />
  );
};

export default Consignor;