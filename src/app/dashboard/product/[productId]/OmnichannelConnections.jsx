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
      icon: <FaGlobe size={16} />,
      active: hasWebstoreAccess,
      status: hasWebstoreAccess ? "Live" : "Not active",
    },
    {
      key: "vinted",
      label: "Vinted Pro",
      icon: <FaTags size={16} />,
      active: false,
      status: "Coming soon",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: <FaInstagram size={16} />,
      active: canPostToInstagram,
      status: canPostToInstagram ? "Connected" : "Not shared yet",
    },
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-4">
        Omnichannel Connections
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-800 font-medium">
              {row.icon} {row.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{row.status}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${row.active ? "bg-green-500" : "bg-gray-300"}`}
              />
              {row.key === "webstore" && row.active && (
                <a href="/dashboard/profile" target="_blank" rel="noopener noreferrer">
                  <FiExternalLink size={13} className="text-gray-400" />
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
  <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-5 text-white flex items-center justify-between gap-4">
    <div>
      <p className="font-bold text-lg leading-tight">Your Own Webstore</p>
      <p className="text-sm text-white/90 mt-1">
        Branded and launched by our team, synced with your listings automatically.
      </p>
      <p className="text-sm font-semibold mt-2">From 4800 DKK/m</p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 bg-white text-red-600 font-semibold px-4 py-2 rounded-full text-sm whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export const AutomateWorkflowUpsellCard = () => (
  <div className="bg-white rounded-xl border-2 border-gray-200 p-5 flex items-center justify-between gap-4">
    <div>
      <p className="font-bold text-lg leading-tight text-gray-900">
        Automate your entire workflow
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Sync Webstore, Vinted &amp; Instagram from one place.
      </p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 bg-red-600 text-white font-semibold px-4 py-2 rounded-full text-sm whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export default OmnichannelConnections;
