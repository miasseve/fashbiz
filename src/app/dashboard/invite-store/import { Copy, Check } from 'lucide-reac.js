import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
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
};

export default function ReferralCard() {
  const referralLink = "REFER2024XYZ";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md md:max-w-lg lg:max-w-xl text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          Refer & Earn
        </h2>
        <p className="text-sm sm:text-base text-gray-700">
          Get <span className="font-semibold">1 month free</span> per paid
          referral. Share your unique code below.
        </p>

        {referralLink && (
          <div className="bg-gray-100 p-3 sm:p-4 mt-4 sm:mt-6 rounded-lg shadow-sm">
            <span className="font-semibold block mb-2 text-sm sm:text-base">
              Your referral Code:
            </span>
            <div className="flex items-center justify-between bg-white border p-2 rounded">
              <span className="truncate text-sm sm:text-base">{referralLink}</span>
              <CopyButton text={referralLink} />
            </div>
          </div>
        )}

        <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">
          Credits apply after your referral's first payment.
        </p>
      </div>
    </div>
  );
}

