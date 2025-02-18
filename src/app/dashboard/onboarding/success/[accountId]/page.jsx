import React from 'react'
import { storeSuccessResult } from '@/actions/accountAction';
import { redirect } from 'next/navigation'
const page = async({ params }) => {
    const {accountId} = await params;
    const res = await storeSuccessResult(accountId);
    if(res.status === 200)
    {
      redirect('/dashboard/stripe-connect')
    }
    console.log(res);
  return (
    <div>Account Stored Successfully!!</div>
  )
}

export default page