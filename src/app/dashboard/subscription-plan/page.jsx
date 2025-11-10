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
    // <h3>In Progress</h3>
    <SubscriptionPlans user={user}/>
  )
}

export default page