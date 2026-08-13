import Link from "next/link";
import { FaGlobe, FaInstagram, FaTags } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

// Mirrors the same connection status shown in the sidebar (see
// dashboard/sidebar.jsx) — Webstore/Instagram reflect real subscription
// access, Vinted Pro always shows as not-connected since there's no real
// integration built for it yet.
const OmnichannelConnections = ({ hasWebstoreAccess, canPostToInstagram }) => {
  const rows = [
    {
      key: "webstore",
      label: "Webstore",
      icon: <FaGlobe size={18} />,
      active: hasWebstoreAccess,
      status: hasWebstoreAccess ? "Live" : "Not active",
    },
    {
      key: "vinted",
      label: "Vinted Pro",
      icon: <FaTags size={18} />,
      active: false,
      status: "Coming soon",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: <FaInstagram size={18} />,
      active: canPostToInstagram,
      status: canPostToInstagram ? "Connected" : "Not shared yet",
    },
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
      <p className="text-base uppercase tracking-wide text-gray-700 font-bold mb-4">
        Omnichannel Connections
      </p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-800 font-semibold text-base">
              {row.icon} {row.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{row.status}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${row.active ? "bg-green-500" : "bg-gray-300"}`}
              />
              {row.key === "webstore" && row.active && (
                <a href="/dashboard/profile" target="_blank" rel="noopener noreferrer">
                  <FiExternalLink size={15} className="text-gray-400" />
                </a>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WebstoreUpsellCard = () => (
  <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-6 text-white flex items-center justify-between gap-6 flex-wrap">
    <div>
      <p className="font-bold text-xl leading-tight">Your Own Webstore</p>
      <p className="text-base text-white/90 mt-1.5">
        Branded and launched by our team, synced with your listings automatically.
      </p>
      <p className="text-base font-semibold mt-2">From 4800 DKK/m</p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 bg-white text-red-600 font-semibold px-5 py-2.5 rounded-full text-base whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export const AutomateWorkflowUpsellCard = () => (
  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 flex items-center justify-between gap-6 flex-wrap">
    <div>
      <p className="font-bold text-xl leading-tight text-gray-900">
        Automate your entire workflow
      </p>
      <p className="text-base text-gray-500 mt-1.5">
        Sync Webstore, Vinted &amp; Instagram from one place.
      </p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 bg-red-600 text-white font-semibold px-5 py-2.5 rounded-full text-base whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export default OmnichannelConnections;
