import React from 'react'

const page = async() => {
  const res = await storeSuccessResult();
  return (
    <div>Account successfully connected!!</div>
  )
}

export default page