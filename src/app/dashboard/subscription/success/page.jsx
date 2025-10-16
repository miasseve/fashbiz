// // ============= app/subscription/success/page.js =============
// "use client";
 
// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { CheckCircle, Loader2 } from "lucide-react";
 
// export default function SubscriptionSuccess() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const sessionId = searchParams.get("session_id");
 
//   useEffect(() => {
//     if (sessionId) {
//       verifySession();
//     } else {
//       setError("No session ID found");
//       setLoading(false);
//     }
//   }, [sessionId]);
 
//   const verifySession = async () => {
//     try {
//       const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
//       const data = await res.json();
     
//       if (!data.success) {
//         setError(data.message || "Payment verification failed");
//       }
//     } catch (error) {
//       console.error("Verification error:", error);
//       setError("Failed to verify payment");
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
//           <p className="text-xl text-gray-700">Verifying your subscription...</p>
//         </div>
//       </div>
//     );
//   }
 
//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
//           <div className="mb-6 flex justify-center">
//             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
//               <span className="text-4xl">❌</span>
//             </div>
//           </div>
         
//           <h1 className="text-2xl font-bold text-gray-800 mb-4">
//             Verification Issue
//           </h1>
         
//           <p className="text-gray-600 mb-8">{error}</p>
         
//           <button
//             onClick={() => router.push("/subscription")}
//             className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Back to Subscriptions
//           </button>
//         </div>
//       </div>
//     );
//   }
 
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
//       <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
//         <div className="mb-6 flex justify-center">
//           <CheckCircle className="w-20 h-20 text-green-500" />
//         </div>
       
//         <h1 className="text-3xl font-bold text-gray-800 mb-4">
//           Subscription Successful! 🎉
//         </h1>
       
//         <p className="text-gray-600 mb-8">
//           Thank you for subscribing! Your payment has been processed successfully and your subscription is now active.
//         </p>
       
//         <div className="space-y-4">
//           <button
//             onClick={() => router.push("/subscription")}
//             className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             View Subscription Details
//           </button>
         
//           <button
//             onClick={() => router.push("/dashboard/profile")}
//             className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//           >
//             Go to Dashboard
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
 
"use client";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
 
export default function SubscriptionSuccess() {
  const router = useRouter();
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
       
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Subscription Successful! 🎉
        </h1>
       
        <p className="text-gray-600 mb-8">
          Your payment has been processed and your subscription is now active.
        </p>
       
        <div className="space-y-3">
          <button
            onClick={() => router.push("/subscription")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Subscription
          </button>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
 