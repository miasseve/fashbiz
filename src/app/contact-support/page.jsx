import React from 'react'

const page = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-fash-gradient py-12 px-4">
    <div className="max-w-2xl w-full bg-white shadow-md rounded-xl p-8">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800 uppercase">Contact Support</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">
        We're here to help! If you have any questions, concerns, or need assistance with anything, feel free to reach out.
      </p>
      <div className="space-y-4 text-base text-gray-700">
        <p><strong>Email:</strong> support@yourdomain.com</p>
        <p><strong>Phone:</strong> +1 (123) 456-7890</p>
        <p><strong>Support Hours:</strong> Monday – Friday, 9 AM – 6 PM (EST)</p>
      </div>
      <p className="mt-8 text-sm text-gray-500 text-center">
        We typically respond within 24 hours.
      </p>
    </div>
  </section>
  )
}

export default page