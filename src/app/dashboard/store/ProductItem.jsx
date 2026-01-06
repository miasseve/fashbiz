"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@heroui/react";
import { SiBookmyshow } from "react-icons/si";
import { Card, Button, Checkbox } from "@heroui/react";
import { CheckCircle } from "lucide-react";

const ProductItem = ({
  product,
  isGrid,
  isSelected = false,
  onSelectionChange = () => {},
  selectionMode = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (!selectionMode) {
      router.push(`/dashboard/product/${product._id}`);
    }
  };

  const handleCheckboxChange = (checked) => {
    onSelectionChange(product._id, checked);
  };

  const hasWixProductId = product.wixProductId && product.wixProductId !== "";
  const isUnlinked = !hasWixProductId;

  return (
    <>
      {isGrid ? (
        <>
          <Card
            className={`p-[10px] h-full w-full max-w-sm md:max-w-md lg:max-w-lg border-none rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.2)] group relative ${
              isSelected ? "ring-2 ring-blue-500" : ""
            }`}
          >
            {/* Selection Checkbox or Unlinked Indicator - Top Left */}
            {selectionMode && (
              <div className="absolute top-4 left-4 z-10">
                {hasWixProductId ? (
                  <Checkbox
                    isSelected={isSelected}
                    onValueChange={handleCheckboxChange}
                    size="lg"
                    className="bg-white rounded-md shadow-md"
                  />
                ) : (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                    <CheckCircle size={14} />
                    Unlinked
                  </div>
                )}
              </div>
            )}

            {/* Consignor Badge - Top Right */}
            {product.consignorAccount == "" ? (
              <Badge
                color="danger"
                content={<SiBookmyshow />}
                size="lg"
                shape="circle"
                placement="top-right"
              >
                {product.images.length > 0 && (
                  <div className="overflow-hidden rounded-lg w-full">
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      className="rounded-lg w-full lg:h-[250px] mx-auto object-cover mb-4 transition-transform duration-300 ease-in-out group-hover:scale-110"
                    />
                  </div>
                )}
              </Badge>
            ) : (
              product.images.length > 0 && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={product.images[0].url}
                    alt={product.title}
                    className="rounded-lg w-full lg:h-[250px] mx-auto object-cover mb-4 rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />
                </div>
              )
            )}

            <div className="p-8">
              <h2 className="text-[15px] font-semibold uppercase mb-[10px]">
                {product.title}
              </h2>
              <p className="text-gray-600 text-2xl lg:text-md mb-[15px]">
                {product.description.length > 30
                  ? product.description.slice(0, 90) + "..."
                  : product.description}
              </p>
              {product.price > 1 && (
                <p className="font-bold mt-2 text-2xl lg:text-md mb-[10px] flex items-center">
                  <span> €{product.price.toFixed(2)}</span>
                </p>
              )}
              {product.pointsValue && (
                <p className="font-bold mt-2 text-2xl lg:text-md mb-[10px] flex items-center">
                  <span> Points: {product.pointsValue}</span>
                </p>
              )}

              <Button onPress={handleClick} className="success-btn">
                View Details
              </Button>
            </div>
          </Card>
        </>
      ) : (
        // Line (List) view layout
        <div
          className={`flex items-center bg-[white] p-[10px] rounded-[8px] items-start mb-6 group relative ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
        >
          {/* Selection Checkbox or Unlinked Indicator - Left Side */}
          {selectionMode && (
            <div className="mr-4 flex items-center">
              {hasWixProductId ? (
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={handleCheckboxChange}
                  size="lg"
                />
              ) : (
                <div className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle size={14} />
                  Unlinked
                </div>
              )}
            </div>
          )}

          {product.consignorAccount == "" ? (
            <Badge
              color="danger"
              content={<SiBookmyshow />}
              size="lg"
              shape="circle"
              placement="top-right"
              position="absolute"
              top="30px"
            >
              {product.images.length > 0 && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={product.images[0].url}
                    alt={product.title}
                    className="w-[15rem] h-[15rem] rounded-lg me-[2rem] object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />
                </div>
              )}
            </Badge>
          ) : (
            product.images.length > 0 && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-[15rem] h-[15rem] rounded-lg me-[2rem] object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                />
              </div>
            )
          )}

          <div className="flex gap-[15px] flex-col">
            <div className="flex-1 gap-3">
              <h2 className="text-[20px] font-semibold">{product.title}</h2>
              <p className="text-gray-600">
                {product.description.length > 60
                  ? product.description.slice(0, 60) + "..."
                  : product.description}
              </p>
              {product.price > 1 && (
                <p className="font-bold text-md mt-1">
                  €{product.price.toFixed(2)}
                </p>
              )}
              {
                product.pointsValue && (
                  <p className="font-bold text-md mt-1">
                    Points: {product.pointsValue}
                  </p>
                )
              }
            </div>
            <div>
              <Button onPress={handleClick} className="success-btn">
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductItem;