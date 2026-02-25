"use client";
import React, { useState } from "react";
import { FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";

const ShopifyLink = ({ url }) => {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
      <div className="text-[12px] uppercase text-gray-500 font-semibold tracking-wide mb-2">
        WebStore Product Link
      </div>
      <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 px-3 py-2 text-[12px] text-gray-700 bg-white outline-none truncate"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 text-[12px] font-semibold text-white transition-colors flex items-center gap-1 ${
            copied ? "bg-green-600" : "bg-gray-800 hover:bg-gray-900"
          }`}
        >
          {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <FiExternalLink size={12} />
        Open in Shopify
      </a>
    </div>
  );
};

export default ShopifyLink;
