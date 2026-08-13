"use client";

import { useEffect } from "react";

// Unlocks the password-protected storefront with a REAL top-level form
// submission (not a background fetch) — this is the only way that reliably
// sets Shopify's session cookie across every browser, including Safari/iOS,
// which blocks cookies set by background requests to a different site.
// Trade-off: Shopify's own /password endpoint always redirects to its
// homepage afterward — there is no way to make it land on the originally
// requested product instead, confirmed directly against the live store (no
// hidden field or query param changes that). So the very first time a given
// visitor opens a Ree link, they land on the storefront's homepage already
// unlocked — no password prompt shown at any point. Every link after that,
// for that same visitor, goes straight to the right product with no
// detour at all, since the browser already carries the unlock cookie.
export default function ShopifyUnlocker({ destination, password, shopifyHost }) {
  useEffect(() => {
    if (!password || !shopifyHost) {
      window.location.replace(destination);
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `https://${shopifyHost}/password`;
    form.style.display = "none";

    const fields = { form_type: "storefront_password", utf8: "✓", password };
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }, [destination, password, shopifyHost]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "sans-serif", color: "#555" }}>
      <p>Taking you to the store…</p>
    </div>
  );
}
