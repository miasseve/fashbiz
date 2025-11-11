"use client";
import { Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function InviteStorePage() {
  const [referralLink, setReferralLink] = useState("Generating code...");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const handleGenerateLink = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (res.ok && data?.referralLink) {
          setReferralLink(data.referralLink);
        } else {
          alert(data?.message || "Failed to generate referral link");
        }
      } catch (err) {
        console.error("Error generating referral:", err);
      } finally {
        setLoading(false);
      }
    };
    handleGenerateLink();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:w-[50%] w-[100%] text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">
          Refer & Earn
        </h2>
        <p className="text-base sm:text-2xl text-gray-700">
          Get <span className="font-semibold">1 month free</span> per paid
          referral. Share your unique code below.
        </p>

        {referralLink && (
          <div className="bg-gray-100 p-4 sm:p-5 md:p-6 mt-5 sm:mt-7 rounded-lg shadow-sm">
            <span className="font-semibold block mb-3 text-lg sm:text-xl">
              Your referral Code:
            </span>
            <div className="flex items-center justify-between bg-white border p-3 sm:p-4 rounded gap-2">
              <span className="truncate text-2xl sm:text-2xl min-w-0">
                {referralLink}
              </span>
              <CopyButton text={referralLink} />
            </div>
          </div>
        )}

        <p className="mt-4 sm:mt-5 text-gray-500 text-sm sm:text-base md:text-lg">
          Credits apply after your referral's first payment.
        </p>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <Copy className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}
