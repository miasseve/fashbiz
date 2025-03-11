"use client";
import React, { useEffect, useState } from "react";
import { getQRData } from "@/actions/accountAction";
import ConsignorQR from "./ConsignorQR";
import { Spinner } from "@heroui/react";
import { checkStripeIsConnected } from "@/actions/authActions";

const Page = () => {
  const [qrData, setQrData] = useState(null);
  const [stripeResponse, setStripeResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(qrData,'qrData')
  useEffect(() => {
    // Fetch data when the component mounts
    const fetchData = async () => {
      try {
        // Fetch QR Data
        const qrResponse = await getQRData();

        // Check if Stripe is connected
        const stripeData = await checkStripeIsConnected();

        if (qrResponse.status !== 200) {
          throw new Error(qrResponse.error);
        }

        setQrData(qrResponse.qrData);
        setStripeResponse(stripeData);
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

  return <ConsignorQR qrData={qrData} stripeResponse={stripeResponse} />;
};

export default Page;
