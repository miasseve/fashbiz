import React from 'react';
import { getCartData } from '@/actions/cartActions';
const page = async ({ params }) => {
    const { id } = await params;
    const res=await getCartData(id);
    // const response = await axios.get(`/api/checkout/${id}`); // Pass the id dynamically
    // const { products, subTotal, total, discount } = response.data;
    // console.log(products,subTotal,total,discount,'testing');
  return (
    <div>page</div>
  )
}

export default page