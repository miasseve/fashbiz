"use client";

import { CATEGORIES } from "@/lib/taxonomy";

/**
 * ProductFormFields — shared form inputs used by both SecondStep and TrySecondStep.
 *
 */

const CONDITION_GRADES = [
  { value: "A", label: "A — Like New" },
  { value: "B", label: "B — Good" },
  { value: "C", label: "C — Fair" },
];

const ProductFormFields = ({
  register,
  errors,
  watch,
  fabricOptions,
  colorHex,
  showPriceField = true,
  showConditionFields = false,
  showCategoryField = false,
}) => {
  return (
    <>
      {/* Category — only shown when full AI pipeline is active */}
      {showCategoryField && (
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            {...register("category")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <span className="text-red-500 font-bold text-[12px]">
              {errors.category.message}
            </span>
          )}
        </div>
      )}

      {/* Sub Category */}
      <div>
        <label className="text-sm font-medium">Sub Category</label>
        <input
          placeholder="Sub Category"
          {...register("subcategory")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.subcategory && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.subcategory.message}
          </span>
        )}
      </div>

      {/* SKU */}
      <div>
        <label className="text-sm font-medium">SKU</label>
        <input
          placeholder="Enter SKU"
          {...register("sku")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.sku && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.sku.message}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          placeholder="Title"
          {...register("title")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.title && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.title.message}
          </span>
        )}
      </div>

      {/* Brand */}
      <div>
        <label className="text-sm font-medium">Brand</label>
        <input
          placeholder="Brand"
          {...register("brand")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.brand && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.brand.message}
          </span>
        )}
      </div>

      {/* Size */}
      <div>
        <label className="text-sm font-medium">
          Size:
          <span className="text-s font-normal">
            <em> (Enter sizes separated by commas, e.g. S,M or 38,40)</em>
          </span>
        </label>
        <input
          placeholder="e.g. S, M, L, XL or 38, 40, 42"
          {...register("size")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.size && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.size.message}
          </span>
        )}
      </div>

      {/* Fabric */}
      <div>
        <label className="text-sm font-medium">Fabric</label>
        <select
          {...register("fabric")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Select Fabric</option>
          {fabricOptions.map((fabric) => (
            <option key={fabric} value={fabric}>{fabric}</option>
          ))}
        </select>
        {errors.fabric && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.fabric.message}
          </span>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="text-sm font-medium">Color</label>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="white"
            {...register("color.name")}
            className="border border-gray-300 rounded-md px-3 py-2 w-full"
          />
          <input type="hidden" {...register("color.hex")} value={colorHex || ""} />
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "1px solid #D3D3D3",
              backgroundColor:
                colorHex && colorHex !== "transparent"
                  ? colorHex
                  : watch("color.name")?.trim()
                  ? watch("color.name")
                  : "transparent",
              transition: "background-color 0.3s ease",
            }}
          />
        </div>
        {errors.color && (
          <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
        )}
      </div>

      {/* Condition — only shown when full AI pipeline is active */}
      {showConditionFields && (
        <>
          <div>
            <label className="text-sm font-medium">Condition</label>
            <select
              {...register("condition_grade")}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Condition</option>
              {CONDITION_GRADES.map((cond) => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Condition Notes</label>
            <input
              placeholder="Any visible wear or defects..."
              {...register("condition_notes")}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </>
      )}

      {/* Price */}
      {showPriceField && (
        <div>
          <label className="text-sm font-medium">Price</label>
          <input
            {...register("price")}
            type="text"
            placeholder="Price in DKK"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {errors.price && (
            <span className="text-red-500 font-bold text-[12px]">
              {errors.price.message}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          rows="4"
          placeholder="Enter description"
          {...register("description")}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {errors.description && (
          <span className="text-red-500 font-bold text-[12px]">
            {errors.description.message}
          </span>
        )}
      </div>
    </>
  );
};

export default ProductFormFields;
