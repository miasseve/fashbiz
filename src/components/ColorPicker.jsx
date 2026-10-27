"use client";

/**
 * ColorPicker — a free colour picker (any colour), shown as a clickable swatch.
 *
 * Wraps the native <input type="color">. It doubles as the swatch: it shows the
 * current colour and opens the OS colour picker when clicked. Used next to the
 * editable colour-name field on the add-product form, the product details page
 * and the admin product edit.
 *
 * Props:
 *   value:    hex string (any format; coerced to #rrggbb for display)
 *   onChange: (hex) => void — the #rrggbb the user picked
 *   disabled: boolean
 */

// The native colour input needs a 6-digit #rrggbb value. Expand #rgb, lowercase,
// and fall back to white for anything it can't display (the stored value is only
// overwritten when the user actually picks a colour).
const toHexInput = (hex) => {
  if (typeof hex !== "string") return "#ffffff";
  let h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    h = "#" + h.slice(1).split("").map((c) => c + c).join("");
  }
  return /^#[0-9a-f]{6}$/.test(h) ? h : "#ffffff";
};

const ColorPicker = ({ value, onChange, disabled = false }) => (
  <input
    type="color"
    aria-label="Colour value"
    title="Pick a colour"
    disabled={disabled}
    value={toHexInput(value)}
    onChange={(e) => onChange(e.target.value)}
    className="h-11 w-16 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0.5 disabled:opacity-50"
  />
);

export default ColorPicker;
