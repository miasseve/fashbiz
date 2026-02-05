"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@heroui/react";
import { SiBookmyshow } from "react-icons/si";
import { Card, Button, Checkbox } from "@heroui/react";
import { CheckCircle, InstagramIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

const ProductItem = ({
  product,
  isGrid,
  isSelected = false,
  isInstagramSelected = false,
  onSelectionChange = () => {},
  onInstagramSelectionChange = () => {},
  selectionMode = false,
  instagramMode = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (!selectionMode && !instagramMode) {
      router.push(`/dashboard/product/${product._id}`);
    }
  };

  const handleCheckboxChange = (checked) => {
    onSelectionChange(product._id, checked);
  };

  const handleInstagramCheckboxChange = (checked) => {
    onInstagramSelectionChange(product._id, checked);
  };

  const hasWixProductId = product.wixProductId && product.wixProductId !== "";
  const isUnlinked = !hasWixProductId;
  const hasInstagramPost = product.hasInstagramPost || false;

  return (
    <>
      {isGrid ? (
        <>
          <Card
            className={`p-[10px] h-full w-full max-w-full md:max-w-md lg:max-w-lg border-none rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.2)] group relative ${
              isSelected || isInstagramSelected ? "ring-2 ring-blue-500" : ""
            }`}
          >
            {/* Selection Checkbox or Status Indicator - Top Left */}
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

            {/* Instagram Selection Checkbox or Status - Top Left */}
            {instagramMode && (
              <div className="absolute top-4 left-4 z-10">
                {!hasInstagramPost ? (
                  <Checkbox
                    isSelected={isInstagramSelected}
                    onValueChange={handleInstagramCheckboxChange}
                    size="lg"
                    className="bg-white rounded-md shadow-md"
                  />
                ) : (
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                    <InstagramIcon size={14} />
                    Posted
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
                      className="rounded-lg w-full h-[250px] mx-auto object-contain mb-4 transition-transform duration-300 ease-in-out group-hover:scale-110"
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

            <div className="p-8 w-full h-[250px] flex flex-col justify-around items-center">
              <h2 className="text-[15px] font-semibold uppercase">
                {product.title}
              </h2>
              <p className="text-gray-600 text-2xl lg:text-md">
                {product.description.length > 30
                  ? product.description.slice(0, 90) + "..."
                  : product.description}
              </p>

              <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-between sm:items-center items-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  {(product.price > 1 || product.pointsValue) && (
                    <p className="font-bold text-lg sm:text-xl lg:text-lg flex items-center space-x-2">
                      {product.price > 1 && (
                        <span className="text-[17px] sm:text-[16px]">
                          €{product.price.toFixed(2)}
                        </span>
                      )}
                      {product.pointsValue != null && (
                        <span className="text-[17px] sm:text-[16px]">
                          Points: {product.pointsValue}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <Button
                  onPress={handleClick}
                  className="w-full sm:w-auto text-white font-semibold bg-black rounded-[24px] sm:px-[14px]  sm:py-[18px] p-[22px] flex items-center justify-center gap-2"
                >
                  View Details <ArrowRight />
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        // Line (List) view layout
        <div
          className={`flex items-center bg-[white] p-[10px] rounded-[8px] items-start mb-6 group relative ${
            isSelected || isInstagramSelected ? "ring-2 ring-blue-500" : ""
          }`}
        >
          {/* Unlinked Indicator - Top Left Corner */}
          {selectionMode && !hasWixProductId && (
            <div className="absolute -top-2 -left-2 z-20 bg-green-100 text-green-700 px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
              <CheckCircle size={14} />
              Unlinked
            </div>
          )}

          {/* Instagram Posted Indicator - Top Left Corner */}
          {instagramMode && hasInstagramPost && (
            <div className="absolute -top-2 -left-2 z-20 bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
              <InstagramIcon size={14} />
              Posted
            </div>
          )}

          {/* Selection Checkbox - Left Side (Only for linked products) */}
          {selectionMode && hasWixProductId && (
            <div className="mr-4 flex items-center">
              <Checkbox
                isSelected={isSelected}
                onValueChange={handleCheckboxChange}
                size="lg"
              />
            </div>
          )}

          {/* Instagram Selection Checkbox - Left Side (Only for non-posted products) */}
          {instagramMode && !hasInstagramPost && (
            <div className="mr-4 flex items-center">
              <Checkbox
                isSelected={isInstagramSelected}
                onValueChange={handleInstagramCheckboxChange}
                size="lg"
              />
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

          <div className="flex gap-[15px] sm:gap-[40px] flex-col sm:w-full">
            <div className="flex-1 gap-3">
              <h2 className="text-[20px] font-semibold">{product.title}</h2>
              <p className="text-gray-600">
                {product.description.length > 60
                  ? product.description.slice(0, 60) + "..."
                  : product.description}
              </p>
            </div>

            <div className="sm:flex sm:justify-between">
              <div>
                {product.price > 1 && (
                  <p className="font-bold text-md mt-1">
                    €{product.price.toFixed(2)}
                  </p>
                )}
                {product.pointsValue && (
                  <p className="font-bold text-md mt-1">
                    Points: {product.pointsValue}
                  </p>
                )}
              </div>
              <div>
                <Button
                  onPress={handleClick}
                  className="w-full sm:w-auto text-white font-semibold bg-black rounded-[24px] sm:px-[14px]  sm:py-[18px] py-[22px] px-0 flex items-center justify-center gap-2"
                >
                  View Details <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductItem;