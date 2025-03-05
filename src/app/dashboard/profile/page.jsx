"use client";
import React, { useEffect, useState } from "react";
import Profile from "./Profile";
import { Spinner } from "@heroui/react";
import { getUser } from "@/actions/authActions";

const Page = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getUser();
        if (response.status !== 200) {
          throw new Error(response.error || "Failed to fetch user data");
        }
        const userData = JSON.parse(response.data);
        setUser(userData); // Set the user data in the state
      } catch (error) {
        setError(error.message); // Set the error if fetching fails
      } finally {
        setLoading(false); // Set loading to false once the fetch is complete
      }
    };

    fetchUserData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    ); // Display loading while fetching
  if (error) return <div>Error: {error}</div>; // Display error if something goes wrong

  return <Profile user={user} />; // Once data is fetched, pass it to the Profile component
};

export default Page;
