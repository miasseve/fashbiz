'use client';
import React from 'react'
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
const Button = () => {
  const router =useRouter();
  const dashboardHandler=()=>{
     router.push('/dashboard/profile');
  }  
  return (
    <Button color="primary" onPress={dashboardHandler}>Dashboard</Button>
  )
}

export default Button