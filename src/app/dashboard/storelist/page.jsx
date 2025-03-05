"use client";
import React, { useEffect, useState } from "react";
import StoreList from "./StoreList";
import { Spinner } from "@heroui/react";
import { getAllStores } from "@/actions/authActions";

const Page = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getAllStores();
        if (response.status !== 200) {
          throw new Error(response.error || "Failed to fetch store data");
        }
        setStores(JSON.parse(response.data));
      } catch (error) {
        setError(error.message);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <StoreList stores={stores} />
    </div>
  );
};

export default Page;
