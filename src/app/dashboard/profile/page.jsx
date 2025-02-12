import React from "react";
import Profile from "./Profile";
import { auth } from "@/auth";
import { getUserById } from "@/actions/authActions";
const page = async () => {
  const session = await auth();
  const response = await getUserById(session.user.id);
  const userData = JSON.parse(response.data);
  return <Profile user={userData} />;
};

export default page;
