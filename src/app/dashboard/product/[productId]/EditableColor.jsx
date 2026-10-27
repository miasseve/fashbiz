"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { updateProduct } from "@/actions/productActions";
import ColorPicker from "@/components/ColorPicker";
import { nameToHex, nearestColorName } from "@/lib/colorNaming";

/**
 * EditableColor — inline colour editor for the product details page.
 *
 * Shows the colour swatch next to its name. Editing keeps the name as an editable
 * text field with a free colour picker beside it, kept in sync both ways: typing a
 * recognised colour name moves the picker, and picking a colour writes the closest
 * common name into the field. Mirrors EditablePrice (inline → updateProduct → refresh).
 */
const EditableColor = ({ productId, color }) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(color?.name || "");
  const [hex, setHex] = useState(color?.hex || "#ffffff");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fill a missing value from the name so the swatch isn't blank.
    if (!color?.hex && color?.name) {
      const resolved = nameToHex(color.name);
      if (resolved) setHex(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swatch colour for the read-only view: stored value, or resolved from the name.
  const displayHex =
    color?.hex || (mounted ? nameToHex(color?.name) : null) || "transparent";

  const reset = () => {
    setName(color?.name || "");
    setHex(color?.hex || nameToHex(color?.name) || "#ffffff");
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Colour name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await updateProduct(productId, {
        color: { name: trimmed, hex },
      });
      if (response.status === 200) {
        toast.success("Colour updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(response.error || "Couldn't save the colour. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save the colour. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            setName(value);
            const resolved = nameToHex(value);
            if (resolved) setHex(resolved);
          }}
          placeholder="Colour name"
          className="w-36 text-base text-gray-900 bg-gray-100 rounded-lg px-3 py-1.5 border-2 border-gray-300 focus:border-gray-500 outline-none"
        />
        <ColorPicker
          value={hex}
          onChange={(value) => {
            setHex(value);
            const nm = nearestColorName(value);
            if (nm) setName(nm);
          }}
          disabled={saving}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
          title="Save colour"
        >
          <FiCheck size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setEditing(false);
          }}
          disabled={saving}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          title="Cancel"
        >
          <FiX size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-7 w-7 shrink-0 rounded-md border border-gray-300"
        style={{ backgroundColor: displayHex }}
        aria-hidden="true"
      />
      <span className="text-xl text-gray-900 font-semibold capitalize">
        {color?.name || "N/A"}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        title="Edit colour"
      >
        <FiEdit2 size={14} />
      </button>
    </div>
  );
};

export default EditableColor;
