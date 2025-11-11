"use client";

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
        <h2 className="text-2xl font-bold mb-4">Refer & Earn</h2>
        <p className="text-gray-700">
          Get <span className="font-semibold">1 month free</span> per paid
          referral. Share your unique code below.
        </p>

        {referralLink && (
          <div className="bg-gray-100 p-4 mt-6 rounded-lg shadow-sm">
            <span className="font-semibold block mb-2">
              Your referral Code:
            </span>
            <div className="flex items-center justify-between bg-white border p-2 rounded">
              <span className="truncate">{referralLink}</span>
              <CopyButton text={referralLink} />
            </div>
          </div>
        )}

        <p className="mt-4 text-gray-500 text-sm">
          Credits apply after your referral’s first payment.
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
      className="ml-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
