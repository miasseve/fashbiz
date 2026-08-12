"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { updateProduct } from "@/actions/productActions";

const EditablePrice = ({ productId, price, currencyLabel = "DKK" }) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(price ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid price");
      return;
    }
    setSaving(true);
    try {
      const response = await updateProduct(productId, { price: parsed });
      if (response.status === 200) {
        toast.success("Price updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(response.error || "Failed to update price");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 text-2xl font-bold text-gray-900 bg-gray-100 rounded-lg px-3 py-1.5 border-2 border-gray-300 focus:border-gray-500 outline-none"
        />
        <span className="text-gray-500 font-medium">{currencyLabel}</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
        >
          <FiCheck size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(price ?? "");
            setEditing(false);
          }}
          disabled={saving}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          <FiX size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-gray-900 bg-gray-100 rounded-lg px-4 py-1.5">
        {price ?? 0} {currencyLabel}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        title="Edit price"
      >
        <FiEdit2 size={14} />
      </button>
    </div>
  );
};

export default EditablePrice;
