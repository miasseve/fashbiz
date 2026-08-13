"use client";

import { useEffect } from "react";

// Runs the actual POST-to-/password handshake in the VISITOR'S browser
// (not our server) so the resulting cookie lands where it needs to —
// Shopify's own domain, in their browser — then forwards them on.
export default function ShopifyUnlocker({ destination, password, shopifyHost }) {
  useEffect(() => {
    let cancelled = false;

    async function unlockAndGo() {
      if (password && shopifyHost) {
        try {
          await fetch(`https://${shopifyHost}/password`, {
            method: "POST",
            mode: "no-cors",
            credentials: "include",
            body: new URLSearchParams({
              form_type: "storefront_password",
              utf8: "✓",
              password,
            }),
          });
        } catch {
          // no-cors gives an opaque response either way — nothing to read.
          // Fall through to the redirect regardless; worst case they land
          // on Shopify's own password page instead of the product.
        }
      }
      if (!cancelled) {
        window.location.replace(destination);
      }
    }

    unlockAndGo();
    return () => {
      cancelled = true;
    };
  }, [destination, password, shopifyHost]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "sans-serif", color: "#555" }}>
      <p>Taking you to your product…</p>
    </div>
  );
}
