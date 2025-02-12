import React from "react";
import Main from "./Main";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
const page = async() => {
    const session = await auth();
    const productCount = await getUserProductCount();

    return <Main user={session.user} productCount={productCount}/>;
};

export default page;
