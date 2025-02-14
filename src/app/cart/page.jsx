import React from 'react'
import CartItems from './CartItems'
import { auth } from '@/auth';
const page = async() => {
      const session = await auth();
  return (
    <CartItems user={session.user}/>
  )
}

export default page