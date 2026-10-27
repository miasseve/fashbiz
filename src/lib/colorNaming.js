// Colour name <-> hex helpers used to keep the colour-name field and the colour
// picker in sync. The picker stays free (any colour); these names are used only
// to (a) label a picked colour with the closest common name — the webshop stores
// the NAME — and (b) resolve a typed name to a colour so the picker can follow it.

// A spread of common colour names with representative shades, used for the
// "closest common name" lookup when a colour is picked.
export const COMMON_COLORS = [
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#FFFFFF" },
  { name: "grey", hex: "#808080" },
  { name: "beige", hex: "#E8DCC4" },
  { name: "cream", hex: "#FFF8E7" },
  { name: "navy", hex: "#1F2A5B" },
  { name: "blue", hex: "#2A5BD7" },
  { name: "light blue", hex: "#8EC5FF" },
  { name: "red", hex: "#D32F2F" },
  { name: "burgundy", hex: "#7B1E3B" },
  { name: "pink", hex: "#F48FB1" },
  { name: "blush", hex: "#E6B2BA" },
  { name: "green", hex: "#2E7D32" },
  { name: "olive", hex: "#6B7A3A" },
  { name: "khaki", hex: "#BDB76B" },
  { name: "yellow", hex: "#F4C20D" },
  { name: "mustard", hex: "#C9A227" },
  { name: "orange", hex: "#EF6C00" },
  { name: "brown", hex: "#6D4C2B" },
  { name: "tan", hex: "#C89F6D" },
  { name: "camel", hex: "#C19A6B" },
  { name: "purple", hex: "#7B4BC9" },
  { name: "lavender", hex: "#B57EDC" },
  { name: "gold", hex: "#D4AF37" },
  { name: "silver", hex: "#C0C0C0" },
  { name: "coral", hex: "#FF7F50" },
  { name: "teal", hex: "#008080" },
  { name: "mint", hex: "#98D8C8" },
];

// Normalise any hex string to #rrggbb (expands #rgb, lowercases); null if invalid.
export function normalizeHex(hex) {
  if (typeof hex !== "string") return null;
  let h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    h = "#" + h.slice(1).split("").map((c) => c + c).join("");
  }
  return /^#[0-9a-f]{6}$/.test(h) ? h : null;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

// The closest common colour NAME to a given colour value (nearest in RGB space).
export function nearestColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let best = null;
  let bestDist = Infinity;
  for (const c of COMMON_COLORS) {
    const t = hexToRgb(c.hex);
    const d =
      (rgb.r - t.r) ** 2 + (rgb.g - t.g) ** 2 + (rgb.b - t.b) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c.name;
    }
  }
  return best;
}

let _ctx;
function getCtx() {
  if (typeof document === "undefined") return null;
  if (!_ctx) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    _ctx = canvas.getContext("2d");
  }
  return _ctx;
}

function cssRgbToHex(str) {
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const [r, g, b] = m[1].split(",").map((x) => parseFloat(x.trim()));
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

// Resolve a colour NAME to a hex value. Checks the common list first, then any
// CSS colour name the browser recognises (via a canvas). null if not a colour.
export function nameToHex(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  if (!key) return null;

  const found = COMMON_COLORS.find((c) => c.name === key);
  if (found) return normalizeHex(found.hex);

  const ctx = getCtx();
  if (!ctx) return null;

  // Validity test: an unrecognised value leaves fillStyle unchanged, so it would
  // take each sentinel in turn. A real colour resolves to the same string from
  // either sentinel.
  ctx.fillStyle = "#000000";
  ctx.fillStyle = key;
  const a = ctx.fillStyle;
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = key;
  const b = ctx.fillStyle;
  if (a !== b) return null;

  if (a.startsWith("#")) return normalizeHex(a);
  if (a.startsWith("rgb")) return cssRgbToHex(a);
  return null;
}
