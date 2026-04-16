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
  setValue,
  fabricOptions,
  colorHex,
  showPriceField = true,
  showConditionFields = false,
  showCategoryField = false,
  priceSuggestion = null,
  isDemo = false,
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
            className={`w-full border rounded-md px-3 py-2 ${
              errors.price ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.price && (
            <span className="text-red-500 font-bold text-[12px]">
              {errors.price.message}
            </span>
          )}
          {/* AI Price Suggestion */}
          {priceSuggestion?.hasSuggestion ? (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-blue-700">
                  <span className="font-medium">AI Suggested: </span>
                  <span className="font-bold">{priceSuggestion.suggestedPrice} DKK</span>
                  <span className="text-[12px] text-blue-500 ml-2">
                    (range: {priceSuggestion.priceRange.low}–{priceSuggestion.priceRange.high} DKK)
                  </span>
                </div>
                {setValue && (
                  <button
                    type="button"
                    onClick={() =>
                      setValue("price", String(priceSuggestion.suggestedPrice), {
                        shouldValidate: true,
                      })
                    }
                    className="text-[12px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
              <p className="text-[12px] text-blue-400 mt-1">
                Based on {priceSuggestion.stats.sampleSize} similar products from your store
              </p>
            </div>
          ) : priceSuggestion?.eligible && !priceSuggestion?.hasSuggestion ? (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-[12px] text-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="inline-block w-4 h-4 text-yellow-500 align-text-bottom mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                {priceSuggestion.reason}
              </p>
            </div>
          ) : !errors.price ? (
            <p className="text-[12px] text-gray-600 mt-1.5 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="inline-block w-5 h-5 text-blue-500 align-text-bottom mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
              {isDemo
                ? "Not sure what to charge? AI suggestions unlock as you grow after signup."
                : "Sell 300+ products or wait 2 months to unlock AI price suggestions."}
            </p>
          ) : null}
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
