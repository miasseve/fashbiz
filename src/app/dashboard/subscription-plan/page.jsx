import React from 'react';
import SubscriptionPlans from './SubscriptionPlans';
import { getUser } from '@/actions/authActions';

const page =async () => {
  const response = await getUser();

   if (response.status != 200) {
    throw new Error("Failed to fetch user profile");
  }

  const user = JSON.parse(response.data);

  return (
    <div><SubscriptionPlans user={user}/></div>
  )
}

export default page