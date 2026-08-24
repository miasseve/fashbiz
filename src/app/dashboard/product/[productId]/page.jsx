import React from "react";
import { getProductById } from "@/actions/productActions";
import { auth } from "@/auth";
import ImageCarousel from "@/app/product/components/ImageCarousel";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import AddToCart from "@/app/product/[productId]/AddToCart";
import CopyLinkButton from "./CopyLinkButton";
import GenerateBarcode from "./GenerateBarcode";
import UnlinkProduct from "./UnlinkProduct";
import ShopifyLink from "./ShopifyLink";
import EditablePrice from "./EditablePrice";
import SoldDelistButton from "./SoldDelistButton";
import OmnichannelConnections, {
  WebstoreUpsellCard,
  AutomateWorkflowUpsellCard,
} from "./OmnichannelConnections";
export const metadata = {
  title: "Product",
};

const Page = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);

  if (response.status !== 200) {
    redirect("/");
  }

  const { product, user, userRole, shopifyProductUrl } = response.data;
  const parsedProduct = JSON.parse(product);
  const parsedUser = JSON.parse(user);

  const session = await auth();
  // Computed once at login (see auth.js) — includes both the subscriptionType
  // heuristic and the AddOnPurchase check, so it stays consistent with the
  // sidebar and every other place that shows webstore connection status.
  const hasWebstoreAccess = !!session?.user?.hasWebstoreAccess;
  const canPostToInstagram =
    session?.user?.subscriptionType === "free" ||
    session?.user?.subscriptionType === "Pro" ||
    session?.user?.subscriptionType === "Business";
  // Free-plan stores don't get automatic Shopify-sync delisting, so they
  // need the manual "Mark Sold / Delist" button; paid subscribers already
  // have that happen automatically via the real Shopify sale webhook.
  const isFreePlan = !session?.user?.subscriptionType || session.user.subscriptionType === "free";

  // Brand/Ree-Collect items are a different product type (brandPrice, no
  // Shopify/webstore sync the same way) and aren't part of Mia's redesign —
  // left on the original layout untouched, not part of this change.
  const isBrandOrCollectItem = userRole === "brand" || parsedProduct.collect === true;

  return (
    <div className="container mx-auto p-0 lg:p-12">
      {isBrandOrCollectItem ? (
        <div className="flex flex-col sm:flex-row gap-0 lg:shadow-lg bg-[#fff] p-[20px] rounded-lg p-6 lg:p-10 sm:h-[730px]">
          <div className="w-full sm:w-1/2 flex justify-center sm:sticky sm:top-0 sm:self-start">
            <ImageCarousel images={parsedProduct.images} />
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-6 bg-white p-[20px] border-1 border-[#ccc] lg:shadow-none shadow-lg bg-[#f6f6f6] sm:mt-[0px] mt-[20px] sm:overflow-y-auto">
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {parsedProduct.title}
              </h1>
              {!parsedProduct.pointsValue && (
                <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                  Brand Price: {parsedProduct.brandPrice} DKK
                </div>
              )}
              {parsedProduct.pointsValue && (
                <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                  Points: {parsedProduct.pointsValue}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Brand</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.brand}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Color</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.color?.name || "N/A"}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Sub Category</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.subcategory}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Size</div>
                <div className="text-xl text-gray-900 font-semibold break-words">
                  {parsedProduct.size?.length ? parsedProduct.size.join(", ") : "N/A"}
                </div>
              </div>
              {parsedProduct.fabric && (
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 col-span-2">
                  <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Fabric</div>
                  <div className="text-xl text-gray-900 font-semibold">{parsedProduct.fabric}</div>
                </div>
              )}
            </div>

            {parsedProduct.description && (
              <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-2.5">Description</div>
                <div className="text-gray-700 leading-relaxed text-[15px] break-words">{parsedProduct.description}</div>
              </div>
            )}

            <GenerateBarcode
              barcode={parsedProduct.barcode}
              price={parsedProduct.brandPrice}
              size={parsedProduct.size}
              currency="DKK"
            />

            {parsedUser && (
              <div className="mt-6 bg-gray-50 rounded-xl border-2 border-gray-200 p-5">
                <p className="text-gray-800 font-bold text-lg mb-3">Client Details</p>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">Name:</span> {parsedUser.firstname} {parsedUser.lastname}</p>
                  <p><span className="font-semibold">Email:</span> {parsedUser.email}</p>
                  <p><span className="font-semibold">Address:</span> {parsedUser.address}</p>
                  <p><span className="font-semibold">Phone Number:</span> {parsedUser.phoneNumber}</p>
                  <p><span className="font-semibold">City:</span> {parsedUser.city}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product card — the main workspace */}
          <div className="lg:col-span-2 bg-white rounded-xl lg:shadow-lg p-6 lg:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-5 order-2 sm:order-1">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    {parsedProduct.title}
                  </h1>
                  {parsedProduct.pointsValue ? (
                    <div className="inline-block bg-gray-100 text-gray-900 px-4 py-1.5 rounded-lg font-bold text-xl">
                      {parsedProduct.pointsValue} Points
                    </div>
                  ) : (
                    <EditablePrice productId={parsedProduct._id} price={parsedProduct.price} currencyLabel="€" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Brand</div>
                    <div className="text-base text-gray-900 font-semibold">{parsedProduct.brand}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Color</div>
                    <div className="text-base text-gray-900 font-semibold">{parsedProduct.color?.name || "N/A"}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Category</div>
                    <div className="text-base text-gray-900 font-semibold">{parsedProduct.category}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Sub Category</div>
                    <div className="text-base text-gray-900 font-semibold">{parsedProduct.subcategory}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Size</div>
                    <div className="text-base text-gray-900 font-semibold break-words">
                      {parsedProduct.size?.length ? parsedProduct.size.join(", ") : "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">SKU</div>
                    <div className="text-base text-gray-900 font-semibold break-words">{parsedProduct.sku}</div>
                  </div>
                  {parsedProduct.fabric && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Fabric</div>
                      <div className="text-base text-gray-900 font-semibold">{parsedProduct.fabric}</div>
                    </div>
                  )}
                  {parsedProduct.condition_grade && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Condition</div>
                      <div className="text-base text-gray-900 font-semibold">{parsedProduct.condition_grade}</div>
                    </div>
                  )}
                  {parsedProduct.condition_notes && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 col-span-2">
                      <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Condition Notes</div>
                      <div className="text-base text-gray-900 font-semibold">{parsedProduct.condition_notes}</div>
                    </div>
                  )}
                </div>

                {parsedProduct.description && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">Description</div>
                    <div className="text-gray-700 text-sm break-words">
                      {parsedProduct.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="order-1 sm:order-2">
                <ImageCarousel images={parsedProduct.images} />
              </div>
            </div>

            {/* Barcode — always visible, no click-through needed */}
            <GenerateBarcode
              inline
              barcode={parsedProduct.barcode}
              price={parsedProduct.price > 1 ? parsedProduct.price : null}
              points={parsedProduct.pointsValue ? parsedProduct.pointsValue : null}
              size={parsedProduct.size}
              currency="€"
            />

            {/* Sold status / manual delist for free-plan stores */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-t border-gray-200 pt-4">
              {isFreePlan ? (
                <SoldDelistButton productId={parsedProduct._id} sold={parsedProduct.sold} />
              ) : parsedProduct.sold ? (
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  Item sold — no longer available
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Auto-delists on your webstore when it sells.
                </div>
              )}

              {/* Compact edit/delete — same actions as before, just icon-sized */}
              <div className="flex items-center gap-2 ml-auto">
                <EditButton product={parsedProduct} compact />
                <DeleteButton product={parsedProduct} compact />
              </div>
            </div>
          </div>

          {/* Right column — connections + upsells. Moved back above the fold
              per Mia's feedback ("CTA buttons up here without scrolling —
              otherwise the user doesn't see it") — visibility here matters
              more than the extra width the bottom placement gave them.
              Sticky so it stays in view while scrolling through the taller
              product card on the left, instead of scrolling out of sight
              first. */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <OmnichannelConnections
              hasWebstoreAccess={hasWebstoreAccess}
              canPostToInstagram={canPostToInstagram}
              webstoreUrl={shopifyProductUrl}
            />
            {!isBrandOrCollectItem && (
              <div className="space-y-3 pt-2">
                <AutomateWorkflowUpsellCard />
                <WebstoreUpsellCard />
              </div>
            )}

            {parsedUser && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <p className="text-gray-800 font-bold text-base mb-3">Client Details</p>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <p><span className="font-semibold">Name:</span> {parsedUser.firstname} {parsedUser.lastname}</p>
                  <p><span className="font-semibold">Email:</span> {parsedUser.email}</p>
                  <p><span className="font-semibold">Address:</span> {parsedUser.address}</p>
                  <p><span className="font-semibold">Phone Number:</span> {parsedUser.phoneNumber}</p>
                  <p><span className="font-semibold">City:</span> {parsedUser.city}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous layout for the regular (non-brand, non-collect) product
          page — kept for reference / quick revert per Mia's request, not
          rendered. The redesigned version above (grid lg:grid-cols-3) is
          what's live now. */}
      {false && (
        <div className="flex flex-col sm:flex-row gap-0 lg:shadow-lg bg-[#fff] p-[20px] rounded-lg p-6 lg:p-10 sm:h-[730px]">
          <div className="w-full sm:w-1/2 flex justify-center sm:sticky sm:top-0 sm:self-start">
            <ImageCarousel images={parsedProduct.images} />
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-6 bg-white p-[20px] border-1 border-[#ccc] lg:shadow-none shadow-lg bg-[#f6f6f6] sm:mt-[0px] mt-[20px] sm:overflow-y-auto">
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {parsedProduct.title}
              </h1>
              {parsedProduct.collect !== true && !parsedProduct.pointsValue && (
                <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                  Price: €{parsedProduct.price}
                </div>
              )}
              {parsedProduct.collect === true && !parsedProduct.pointsValue && (
                <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                  Brand Price: {parsedProduct.brandPrice} DKK
                </div>
              )}
              {parsedProduct.collect !== true && parsedProduct.pointsValue && (
                <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                  Points: {parsedProduct.pointsValue}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Brand</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.brand}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Color</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.color?.name || "N/A"}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Sub Category</div>
                <div className="text-xl text-gray-900 font-semibold">{parsedProduct.subcategory}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Size</div>
                <div className="text-xl text-gray-900 font-semibold break-words">
                  {parsedProduct.size?.length ? parsedProduct.size.join(", ") : "N/A"}
                </div>
              </div>
              {parsedProduct.fabric && (
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md col-span-2">
                  <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">Fabric</div>
                  <div className="text-xl text-gray-900 font-semibold">{parsedProduct.fabric}</div>
                </div>
              )}
            </div>

            {parsedProduct.description && (
              <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-2.5">Description</div>
                <div className="text-gray-700 leading-relaxed text-[15px] break-words">{parsedProduct.description}</div>
              </div>
            )}

            {shopifyProductUrl && <ShopifyLink url={shopifyProductUrl} />}

            {(!parsedProduct.collect || parsedProduct.pointsValue == null) && (
              <AddToCart product={parsedProduct} />
            )}

            {(userRole === "brand" || parsedProduct.collect) && (
              <GenerateBarcode
                barcode={parsedProduct.barcode}
                price={parsedProduct.brandPrice}
                size={parsedProduct.size}
                currency="DKK"
              />
            )}

            {userRole !== "brand" && parsedProduct.collect !== true && (
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                  <GenerateBarcode
                    barcode={parsedProduct.barcode}
                    price={parsedProduct.price > 1 ? parsedProduct.price : null}
                    points={parsedProduct.pointsValue ? parsedProduct.pointsValue : null}
                    size={parsedProduct.size}
                    currency="€"
                  />
                  <UnlinkProduct product={parsedProduct} />
                </div>
              </div>
            )}

            <div className="space-y-3 mt-4">
              {userRole !== "brand" && (
                <div className="grid grid-cols-2 gap-3">
                  <EditButton product={parsedProduct} />
                  <CopyLinkButton productId={parsedProduct._id} />
                </div>
              )}
            </div>
            {parsedProduct.collect !== true && (
              <DeleteButton product={parsedProduct} />
            )}

            {parsedUser && (
              <div className="mt-6 bg-gray-50 rounded-xl border-2 border-gray-200 p-5">
                <p className="text-gray-800 font-bold text-lg mb-3">Client Details</p>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">Name:</span> {parsedUser.firstname} {parsedUser.lastname}</p>
                  <p><span className="font-semibold">Email:</span> {parsedUser.email}</p>
                  <p><span className="font-semibold">Address:</span> {parsedUser.address}</p>
                  <p><span className="font-semibold">Phone Number:</span> {parsedUser.phoneNumber}</p>
                  <p><span className="font-semibold">City:</span> {parsedUser.city}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
