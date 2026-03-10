/* ─── Pricing constants ─── */
export const VARIANTS = ["light", "lime", "dark"];
export const GROUP_DISPLAY = { "Add": "Add", "Webstore": "Webstore", "Plug-In": "Plugin" };
export const CARD_H = 500;
export const NUDGE = 18;

/* ─── Static content for right compact cards ─── */
export const RIGHT_CARD_STATIC = {
  Add: {
    header: "FROM 10 DKK",
    subheader: "per product",
    rows: [
      { label: "Complete Adds", price: "10 DKK" },
      { label: "Instagram", price: "10 DKK" },
      // { label: "Vinted", price: "10 DKK" },
    ],
  },
  Webstore: {
    badge: "WEBSTORE",
    price: "4800 DKK",
    period: "once\n+ 4% per\ntransactions",
  },
  "Plug-In": {
    badge: "PLUG-IN",
    subtitles: ["CONNECT", "YOUR EXISTING", "WEBSTORE"],
    price: "3200 DKK",
  },
};

/* ─── Find the scrollable ancestor ─── */
export function getScrollParent(el) {
  let node = el?.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflow + style.overflowY)) return node;
    node = node.parentElement;
  }
  return window;
}
