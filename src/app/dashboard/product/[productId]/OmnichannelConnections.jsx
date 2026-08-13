import Link from "next/link";
import { FaGlobe, FaInstagram, FaTags } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

// Mirrors the same connection status shown in the sidebar (see
// dashboard/sidebar.jsx) — Webstore/Instagram reflect real subscription
// access, Vinted Pro always shows as not-connected since there's no real
// integration built for it yet.
const OmnichannelConnections = ({ hasWebstoreAccess, canPostToInstagram, webstoreUrl }) => {
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
        {rows.map((row) => {
          const linkable = row.key === "webstore" && row.active && webstoreUrl;
          const content = (
            <>
              <span className="flex items-center gap-2 text-gray-800 font-semibold text-base">
                {row.icon} {row.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{row.status}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${row.active ? "bg-green-500" : "bg-gray-300"}`}
                />
                {linkable && <FiExternalLink size={15} className="text-gray-400" />}
              </span>
            </>
          );

          return linkable ? (
            <a
              key={row.key}
              href={webstoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on your webstore"
              className="flex items-center justify-between hover:opacity-80"
            >
              {content}
            </a>
          ) : (
            <div key={row.key} className="flex items-center justify-between">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WebstoreUpsellCard = () => (
  <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-4 text-white flex items-center gap-3">
    <div className="min-w-0">
      <p className="font-bold text-sm leading-tight truncate">Your Own Webstore</p>
      <p className="text-xs text-white/90 mt-0.5 truncate">
        Branded and launched by our team, synced automatically.
      </p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 ml-auto bg-white text-red-600 font-semibold px-4 py-2 rounded-full text-xs whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export const AutomateWorkflowUpsellCard = () => (
  <div className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-3">
    <div className="min-w-0">
      <p className="font-bold text-sm leading-tight text-gray-900 truncate">
        Automate your entire workflow
      </p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">
        Sync Webstore, Vinted &amp; Instagram from one place.
      </p>
    </div>
    <Link
      href="/dashboard/subscription-plan"
      className="shrink-0 ml-auto bg-red-600 text-white font-semibold px-4 py-2 rounded-full text-xs whitespace-nowrap"
    >
      Get started
    </Link>
  </div>
);

export default OmnichannelConnections;
