import axios from "axios";
import { getShopifyStorefrontPassword, buildStorefrontLink } from "@/lib/shopifySettings";
import { resolveStoreConfigForUser } from "@/lib/shopifyStoreResolver";

const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const shopify = axios.create({
  baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10/graphql.json`,
  headers: {
    "X-Shopify-Access-Token": shopifyAccessToken,
    "Content-Type": "application/json",
  },
});

// Base-store API version, matched to the module-level `shopify` client above
// so the no-storeConfig path is provably identical to what it's always been.
const BASE_STORE_API_VERSION = "2024-10";

/**
 * Builds the Shopify Admin API client to use for a call, given an optional
 * per-store config ({ storeDomain, accessToken, apiVersion }).
 *
 * No storeConfig -> returns the existing shared `shopify` client and env
 * values above, completely unchanged. This is the path every current caller
 * takes today, since nothing yet passes a storeConfig.
 *
 * A storeConfig -> builds a fresh client for that store/token/API version.
 * Used only by createShopifyProduct and the handful of internal helpers it
 * depends on (getShopifyLocations, updateInventory,
 * publishProductToFacebookInstagram) so a routed store's product creation
 * can't accidentally touch a different store's inventory, locations, or
 * Facebook/Instagram channel.
 */
function buildShopifyClient(storeConfig) {
  if (!storeConfig) {
    return {
      client: shopify,
      storeDomain: shopifyStoreDomain,
      accessToken: shopifyAccessToken,
      apiVersion: BASE_STORE_API_VERSION,
    };
  }

  const {
    storeDomain,
    accessToken,
    apiVersion = BASE_STORE_API_VERSION,
  } = storeConfig;

  return {
    client: axios.create({
      baseURL: `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }),
    storeDomain,
    accessToken,
    apiVersion,
  };
}

// CREATE PRODUCT
export async function createShopifyProduct(formData, storeConfig) {
  try {
    const {
      title,
      sku,
      brand,
      description,
      price,
      images = [],
      color,
      size,
      fabric,
      subcategory,
      // shopifyCollectionId,
      tags = [],
      barcodeValue,
      pointsValue = null,
      storeName = "",
    } = formData;

    // Resolve once. No storeConfig -> identical to the module-level `shopify`
    // client and env values used throughout the rest of this file.
    const {
      client,
      storeDomain: targetStoreDomain,
      accessToken: targetAccessToken,
      apiVersion: targetApiVersion,
    } = buildShopifyClient(storeConfig);

    // Get location ID (with fallback if permissions are missing)
    let locationId;
    try {
      const locations = await getShopifyLocations(storeConfig);
      const activeLocation = locations.find((l) => l.isActive);
      locationId = activeLocation?.id;

      if (!locationId) {
        console.warn("⚠ No active location found, inventory won't be tracked");
      }
    } catch (error) {
      console.warn(
        "⚠ Could not fetch locations (missing read_locations scope?). Inventory won't be set.",
      );
      locationId = null;
    }

    const formattedPrice = parseFloat(price).toFixed(2);

    const sizesArray = size
      ? Array.isArray(size)
        ? size
        : size.split(",").map((s) => s.trim())
      : [];

    const CREATE_PRODUCT = `
      mutation productCreate($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            handle
            options {
              id
              name
              position
              optionValues {
                id
                name
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const productOptions = [];

    if (color) {
      productOptions.push({
        name: "Color",
        values: [
          { name: typeof color === "string" ? color : color.name || "Default" },
        ],
      });
    }

    if (sizesArray.length) {
      productOptions.push({
        name: "Size",
        values: sizesArray.map((s) => ({ name: s })),
      });
    }

    if (fabric) {
      productOptions.push({
        name: "Fabric",
        values: [{ name: fabric }],
      });
    }

    const formattedTags = Array.isArray(tags) ? [...tags] : [];

    // Add points-product tag for points-based products
    if (pointsValue != null) {
      formattedTags.push("points-product");
    }

    const productInput = {
      title,
      descriptionHtml: description,
      vendor: storeName || brand,
      productType: subcategory,
      status: "ACTIVE",
      productOptions: productOptions,
      tags: formattedTags,
    };

    // Add metafields for points_value and store_label
    const metafields = [];
    if (pointsValue != null) {
      metafields.push({
        namespace: "custom",
        key: "points_value",
        value: String(pointsValue),
        type: "number_integer",
      });
    }
    if (storeName) {
      metafields.push({
        namespace: "custom",
        key: "store_label",
        value: storeName,
        type: "single_line_text_field",
      });
    }
    if (metafields.length > 0) {
      productInput.metafields = metafields;
    }

    const productRes = await client.post("", {
      query: CREATE_PRODUCT,
      variables: { product: productInput },
    });

    if (productRes.data.errors) {
      return {
        status: 400,
        error: productRes.data.errors[0].message,
        details: productRes.data.errors,
      };
    }

    const productCreate = productRes.data.data.productCreate;

    if (productCreate.userErrors && productCreate.userErrors.length) {
      return {
        status: 400,
        error: productCreate.userErrors[0].message,
        userErrors: productCreate.userErrors,
      };
    }

    const productId = productCreate.product.id;
    const productHandle = productCreate.product.handle;

    // Wait a moment for product to be fully created
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get existing variants with all necessary fields
    const GET_EXISTING_VARIANTS = `
      query getProductVariants($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            edges {
              node {
                id
                sku
                price
                barcode
                selectedOptions {
                  name
                  value
                }
                inventoryItem {
                  id
                  tracked
                }
              }
            }
          }
        }
      }
    `;

    const existingRes = await client.post("", {
      query: GET_EXISTING_VARIANTS,
      variables: { id: productId },
    });

    const existingVariants =
      existingRes.data?.data?.product?.variants?.edges || [];

    // Capture first variant for REE product linking
    const firstVariantNode = existingVariants[0]?.node;
    const firstVariantId = firstVariantNode?.id || null;
    const firstInventoryItemId = firstVariantNode?.inventoryItem?.id || null;

    // Build lookup map for existing variants
    const existingVariantMap = new Map();

    existingVariants.forEach(({ node }) => {
      const key = node.selectedOptions
        .map((o) => `${o.name}:${o.value}`)
        .sort()
        .join("|");

      existingVariantMap.set(key, node);
    });

    // Step 2: Update prices using productVariantsBulkUpdate

    if (existingVariants.length > 0) {
      const UPDATE_VARIANTS_BULK = `
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            product {
              id
            }
            productVariants {
              id
              price
              barcode
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variantsToUpdate = existingVariants.map(({ node }) => {
        // Determine the SKU for this variant
        const sizeOption = node.selectedOptions.find(
          (opt) => opt.name === "Size",
        );
        let variantSku = sku;

        if (sizeOption && sizesArray.length > 0) {
          variantSku = `${sku}-${sizeOption.value}`;
        }

        const updatePayload = {
          id: node.id,
          price: formattedPrice,
          inventoryItem: {
            sku: variantSku, // SKU must be in inventoryItem object
          },
        };

        // Add barcode if provided (barcode is at variant level, not inventoryItem)
        if (barcodeValue) {
          updatePayload.barcode = barcodeValue;
        }

        return updatePayload;
      });

      const priceUpdateRes = await client.post("", {
        query: UPDATE_VARIANTS_BULK,
        variables: {
          productId,
          variants: variantsToUpdate,
        },
      });

      if (priceUpdateRes.data?.errors) {
        console.error(
          " GraphQL errors:",
          JSON.stringify(priceUpdateRes.data.errors, null, 2),
        );
      }

      if (
        priceUpdateRes.data?.data?.productVariantsBulkUpdate?.userErrors?.length
      ) {
        console.error(
          " Price update user errors:",
          JSON.stringify(
            priceUpdateRes.data.data.productVariantsBulkUpdate.userErrors,
            null,
            2,
          ),
        );
      } else {
        const updatedVariants =
          priceUpdateRes.data?.data?.productVariantsBulkUpdate
            ?.productVariants || [];
        // console.log(`Prices updated successfully!`);
      }
    }

    // Step 3: Enable inventory tracking and set quantities

    if (locationId) {
      for (const { node } of existingVariants) {
        try {
          // Enable inventory tracking
          const ENABLE_TRACKING = `
            mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
              inventoryItemUpdate(id: $id, input: $input) {
                inventoryItem {
                  id
                  tracked
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          await client.post("", {
            query: ENABLE_TRACKING,
            variables: {
              id: node.inventoryItem.id,
              input: { tracked: true },
            },
          });

          // Set inventory quantity
          await updateInventory(node.inventoryItem.id, locationId, 1, storeConfig);
        } catch (invError) {
          console.error(
            `⚠ Error setting inventory for variant ${node.id}:`,
            invError.message,
          );
        }
      }
    }

    // Build desired variants
    const desiredVariants = sizesArray.length
      ? sizesArray.map((s) => {
          const optionValues = [];

          if (color) {
            optionValues.push({
              optionName: "Color",
              name: typeof color === "string" ? color : color.name,
            });
          }

          if (s) {
            optionValues.push({
              optionName: "Size",
              name: s,
            });
          }

          if (fabric) {
            optionValues.push({
              optionName: "Fabric",
              name: fabric,
            });
          }

          const key = optionValues
            .map((o) => `${o.optionName}:${o.name}`)
            .sort()
            .join("|");

          const variantPayload = {
            price: formattedPrice,
            inventoryItem: {
              sku: `${sku}-${s}`,
            },
            optionValues,
          };

          // Add barcode if provided
          if (barcodeValue) {
            variantPayload.barcode = barcodeValue;
          }

          return {
            key,
            payload: variantPayload,
          };
        })
      : [];

    const variantsToCreate = desiredVariants
      .filter((v) => !existingVariantMap.has(v.key))
      .map((v) => v.payload);

    if (!variantsToCreate.length) {
      // console.log("✓ No new variants to create (already in sync)");
    } else {
      // console.log(`\nCreating ${variantsToCreate.length} missing variants...`);

      const CREATE_VARIANTS = `
        mutation productVariantsBulkCreate(
          $productId: ID!
          $variants: [ProductVariantsBulkInput!]!
        ) {
          productVariantsBulkCreate(
            productId: $productId
            variants: $variants
          ) {
            productVariants {
              id
              sku
              price
              barcode
              inventoryItem {
                id
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variantRes = await client.post("", {
        query: CREATE_VARIANTS,
        variables: {
          productId,
          variants: variantsToCreate,
        },
      });

      if (
        variantRes.data?.data?.productVariantsBulkCreate?.userErrors?.length
      ) {
        console.error(
          "⚠ Variant user errors:",
          variantRes.data.data.productVariantsBulkCreate.userErrors,
        );
      } else {
        const newVariants =
          variantRes.data?.data?.productVariantsBulkCreate?.productVariants ||
          [];

        // Set inventory for new variants
        if (locationId) {
          for (const variant of newVariants) {
            try {
              const ENABLE_TRACKING = `
                mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
                  inventoryItemUpdate(id: $id, input: $input) {
                    inventoryItem {
                      id
                      tracked
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `;

              await client.post("", {
                query: ENABLE_TRACKING,
                variables: {
                  id: variant.inventoryItem.id,
                  input: { tracked: true },
                },
              });

              await updateInventory(variant.inventoryItem.id, locationId, 1, storeConfig);
            } catch (invError) {
              console.error(
                `Error setting inventory for new variant ${variant.id}:`,
                invError.message,
              );
            }
          }
        }
      }
    }

    // Add media
    if (images.length) {
      const CREATE_MEDIA = `
        mutation productCreateMedia(
          $productId: ID!
          $media: [CreateMediaInput!]!
        ) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              ... on MediaImage {
                id
                image {
                  url
                }
              }
            }
            mediaUserErrors {
              field
              message
            }
          }
        }
      `;

      const mediaInputs = images.map((img) => ({
        mediaContentType: "IMAGE",
        originalSource: img.url,
        alt: title,
      }));

      const mediaRes = await client.post("", {
        query: CREATE_MEDIA,
        variables: { productId, media: mediaInputs },
      });

      if (mediaRes.data.errors) {
        console.error("⚠ Media errors:", mediaRes.data.errors);
      }

      if (mediaRes.data?.data?.productCreateMedia?.mediaUserErrors?.length) {
        const mediaErrors =
          mediaRes.data.data.productCreateMedia.mediaUserErrors;
        console.error("Media user errors:", mediaErrors);
      } else {
        // console.log("Media added successfully");
      }
    }

    // Add to collections
    // const collectionIds = [];
    // if (shopifyCollectionId) {
    //   collectionIds.push(shopifyCollectionId);
    // }

    // const uniqueCollectionIds = [...new Set(collectionIds)];

    // for (const colId of uniqueCollectionIds) {
    //   await addProductToCollection(productId, colId);
    // }

    // Auto-creating a smart collection per tag combination used to happen here.
    // Removed — it was pure harm:
    //
    //  1. Its return value was assigned and never used, so it did nothing for
    //     the product being created.
    //  2. It built the rules with `appliedDisjunctively: true` (match ANY tag)
    //     over generic AI tags like "casual", "women", "white", so every new tag
    //     combination produced another near-duplicate collection holding most
    //     of the catalogue. The base store had accumulated 144 collections, 123
    //     of them auto-generated this way.
    //  3. It used the module-level base-store client, so a CONNECTED store's
    //     product created on its own Shopify still created a junk collection on
    //     OUR base store, named after that merchant's tags.
    //
    // Routing it per-store would have been worse, not better: it would spray
    // those same junk collections across merchants' real storefronts. Putting a
    // product in the right collection is a deliberate placement decision and is
    // handled by the storeCollection work (see CPH-CATEGORY-MAPPING.md §6.1),
    // not by inventing collections from tags.

    // Ensure Shopify order webhook is registered (idempotent)
    try {
      const { registerShopifyWebhooks } = await import("./shopifyWebhookActions");
      await registerShopifyWebhooks();
    } catch (webhookErr) {
      console.error("Failed to register Shopify webhook:", webhookErr.message);
    }

    // Publish product to the Online Store sales channel via REST API.
    // This uses published:true which only requires write_products scope,
    // avoiding the read_publications/write_publications scope requirement.
    try {
      const numericProductId = productId.split("/").pop();
      await axios.put(
        `https://${targetStoreDomain}/admin/api/${targetApiVersion}/products/${numericProductId}.json`,
        { product: { id: numericProductId, published: true } },
        { headers: { "X-Shopify-Access-Token": targetAccessToken, "Content-Type": "application/json" } },
      );
    } catch (pubErr) {
      console.error("Failed to publish product to Online Store:", pubErr.response?.data || pubErr.message);
    }

    // Auto-publish to Facebook & Instagram sales channel so products
    // are immediately available in the catalog without manual selection.
    // Wait 3s first so Shopify has time to attach images before the catalog syncs.
    setTimeout(async () => {
      try {
        await publishProductToFacebookInstagram(productId, storeConfig);
      } catch (fbErr) {
        console.error("Failed to publish product to Facebook & Instagram:", fbErr.message);
      }
    }, 3000);

    return {
      status: 200,
      message: "Product created successfully",
      productId,
      productHandle,
      variantId: firstVariantId,
      inventoryItemId: firstInventoryItemId,
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
      details: error.response?.data || null,
      statusCode: error.response?.status || null,
    };
  }
}

//  UPDATE PRODUCT PRICE
export async function updateProductPrice(productId, newPrice) {
  try {
    // First, get all variants
    const GET_VARIANTS = `
      query getProductVariants($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const variantsRes = await shopify.post("", {
      query: GET_VARIANTS,
      variables: { id: productId },
    });

    const variants = variantsRes.data?.data?.product?.variants?.edges || [];

    if (!variants.length) {
      return { success: false, error: "No variants found" };
    }

    // Update all variants with new price
    const UPDATE_VARIANTS_BULK = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          product {
            id
          }
          productVariants {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const formattedPrice = parseFloat(newPrice).toFixed(2);

    const variantsToUpdate = variants.map(({ node }) => ({
      id: node.id,
      price: formattedPrice,
    }));

    const response = await shopify.post("", {
      query: UPDATE_VARIANTS_BULK,
      variables: {
        productId,
        variants: variantsToUpdate,
      },
    });

    if (response.data.errors) {
      console.error("Price update errors:", response.data.errors);
      return { success: false, errors: response.data.errors };
    }

    const bulkUpdate = response.data.data.productVariantsBulkUpdate;

    if (bulkUpdate.userErrors && bulkUpdate.userErrors.length) {
      console.error("Price update user errors:", bulkUpdate.userErrors);
      return { success: false, userErrors: bulkUpdate.userErrors };
    }

    // console.log("✓ Price updated successfully");
    return { success: true, variants: bulkUpdate.productVariants };
  } catch (error) {
    console.error("Error updating price:", error);
    return { success: false, error: error.message };
  }
}

// UPDATE PRODUCT METAFIELD
export async function updateProductMetafield(productId, namespace, key, value, type, storeConfig) {
  try {
    // Shadow the module-level `shopify` with the resolved per-store client.
    // No storeConfig -> buildShopifyClient returns the base-store client, so
    // this is byte-identical to before for any non-connected store.
    const { client: shopify } = buildShopifyClient(storeConfig);

    const METAFIELDS_SET = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await shopify.post("", {
      query: METAFIELDS_SET,
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace,
            key,
            value,
            type,
          },
        ],
      },
    });

    if (response.data?.data?.metafieldsSet?.userErrors?.length) {
      console.error("Metafield update errors:", response.data.data.metafieldsSet.userErrors);
      return { success: false, errors: response.data.data.metafieldsSet.userErrors };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating metafield:", error);
    return { success: false, error: error.message };
  }
}

// SYNC SINGLE PRODUCT METAFIELDS TO SHOPIFY
export async function syncProductMetafieldsToShopify(product, storeName) {
  try {
    const { shopifyProductId, pointsValue } = product;
    if (!shopifyProductId) return { success: false, error: "No shopifyProductId" };

    const metafields = [];
    if (pointsValue != null) {
      metafields.push({
        ownerId: shopifyProductId,
        namespace: "custom",
        key: "points_value",
        value: String(pointsValue),
        type: "number_integer",
      });
    }
    if (storeName) {
      metafields.push({
        ownerId: shopifyProductId,
        namespace: "custom",
        key: "store_label",
        value: storeName,
        type: "single_line_text_field",
      });
    }
    if (metafields.length === 0) return { success: false, error: "No metafields to sync" };

    const METAFIELDS_SET = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key value }
          userErrors { field message }
        }
      }
    `;

    const response = await shopify.post("", {
      query: METAFIELDS_SET,
      variables: { metafields },
    });

    if (response.data?.data?.metafieldsSet?.userErrors?.length) {
      return { success: false, errors: response.data.data.metafieldsSet.userErrors };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BULK SYNC ALL PRODUCTS' METAFIELDS TO SHOPIFY
export async function bulkSyncMetafieldsToShopify() {
  const Product = (await import("@/models/Product")).default;
  const dbConnect = (await import("@/lib/db")).default;
  await dbConnect();

  const products = await Product.find({
    shopifyProductId: { $ne: null },
  }).populate("userId", "storename brandname");

  const results = { synced: 0, skipped: 0, failed: 0, errors: [] };

  for (const product of products) {
    try {
      const storeName = product.userId?.storename || product.userId?.brandname || "";
      const result = await syncProductMetafieldsToShopify(product, storeName);

      if (result.success) {
        results.synced++;
      } else {
        results.skipped++;
      }

      // Rate limit: 500ms between requests
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      results.failed++;
      results.errors.push({ title: product.title, error: err.message });
    }
  }

  return results;
}

// UPDATE INVENTORY
export async function updateInventory(inventoryItemId, locationId, quantity, storeConfig) {
  try {
    const { client } = buildShopifyClient(storeConfig);

    const UPDATE_INVENTORY = `
      mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) {
          inventoryAdjustmentGroup {
            reason
            changes {
              name
              delta
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.post("", {
      query: UPDATE_INVENTORY,
      variables: {
        input: {
          reason: "correction",
          name: "on_hand",
          ignoreCompareQuantity: true,
          quantities: [
            {
              inventoryItemId,
              locationId,
              quantity,
            },
          ],
        },
      },
    });

    if (response.data.errors) {
      console.error("Inventory update errors:", response.data.errors);
      return { success: false, errors: response.data.errors };
    }

    const inventoryUpdate = response.data.data.inventorySetQuantities;

    if (inventoryUpdate.userErrors && inventoryUpdate.userErrors.length) {
      console.error(
        "Inventory update user errors:",
        inventoryUpdate.userErrors,
      );
      return { success: false, userErrors: inventoryUpdate.userErrors };
    }

    return { success: true, changes: inventoryUpdate.inventoryAdjustmentGroup };
  } catch (error) {
    console.error("Error updating inventory:", error);
    return { success: false, error: error.message };
  }
}

//delete products from shopify
export async function deleteShopifyProduct(products, storeConfig) {
  try {
    // Route the delete to the owner's connected Shopify when a storeConfig is
    // given (resolved by the caller), otherwise shadow resolves to the shared
    // base-store client — byte-identical to the previous behaviour.
    const { client: shopify } = buildShopifyClient(storeConfig);

    // Normalize input: allow single ID or array
    const productList = Array.isArray(products) ? products : [products];

    if (productList.length === 0) {
      return { success: false, error: "No products provided" };
    }

    const results = {
      successful: [],
      failed: [],
    };

    const DELETE_PRODUCT = `
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;

    for (const product of productList) {
      const shopifyProductId =
        typeof product === "string" ? product : product?.shopifyProductId;

      if (!shopifyProductId) {
        results.failed.push({
          product,
          error: "Missing shopifyProductId",
        });
        continue;
      }

      try {
        const response = await shopify.post("", {
          query: DELETE_PRODUCT,
          variables: {
            input: { id: shopifyProductId },
          },
        });

        if (response.data?.errors?.length) {
          results.failed.push({
            shopifyProductId,
            errors: response.data.errors,
          });
          continue;
        }

        const deleteResult = response.data?.data?.productDelete;

        if (deleteResult?.userErrors?.length) {
          results.failed.push({
            shopifyProductId,
            userErrors: deleteResult.userErrors,
          });
          continue;
        }

        results.successful.push({
          shopifyProductId,
          deletedProductId: deleteResult.deletedProductId,
        });

      } catch (err) {
        results.failed.push({
          shopifyProductId,
          error: err.message,
        });
      }
    }

    return {
      success: results.failed.length === 0,
      results,
      summary: {
        total: productList.length,
        successful: results.successful.length,
        failed: results.failed.length,
      },
    };
  } catch (error) {
    console.error("Error in deleteShopifyProduct:", error);
    return { success: false, error: error.message };
  }
}

export async function disableShopifyProduct(productId) {
  try {
    const DISABLE_PRODUCT = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id status }
          userErrors { field message }
        }
      }
    `;

    const response = await shopify.post("", {
      query: DISABLE_PRODUCT,
      variables: {
        input: {
          id: productId,
          status: "DRAFT",
        },
      },
    });

    if (response.data?.errors) {
      console.error("Error disabling Shopify product:", response.data.errors);
      return { success: false, errors: response.data.errors };
    }

    const result = response.data?.data?.productUpdate;
    if (result?.userErrors?.length) {
      console.error("User errors disabling Shopify product:", result.userErrors);
      return { success: false, userErrors: result.userErrors };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in disableShopifyProduct:", error.message);
    return { success: false, error: error.message };
  }
}


// Cache the Facebook & Instagram publication ID so we only look it up once per
// process — for the base store only. A publication ID belongs to one specific
// shop's channel, so a passed storeConfig never reads or writes this cache;
// it always resolves its own publication ID fresh (see publicationId below).
let _facebookPublicationId = null;

/**
 * Publish a product to the Facebook & Instagram sales channel automatically.
 * Requires read_publications + write_publications scopes on the Shopify app.
 */
async function publishProductToFacebookInstagram(shopifyProductGid, storeConfig) {
  const { client } = buildShopifyClient(storeConfig);

  // Base-store path (no storeConfig): behaves exactly as before, using the
  // shared cache and the SHOPIFY_FACEBOOK_PUBLICATION_ID shortcut.
  // Routed-store path (storeConfig passed): always starts uncached.
  let publicationId = storeConfig ? null : _facebookPublicationId;

  if (!publicationId && !storeConfig) {
    publicationId = process.env.SHOPIFY_FACEBOOK_PUBLICATION_ID || null;
    _facebookPublicationId = publicationId;
  }

  if (!publicationId) {
    // Query Shopify for the Facebook & Instagram publication ID
    const pubRes = await client.post("", {
      query: `query {
        publications(first: 20) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`,
    });

    const publications = pubRes.data?.data?.publications?.edges || [];
    const fbPub = publications.find(
      (e) =>
        e.node.name.toLowerCase().includes("facebook") ||
        e.node.name.toLowerCase().includes("instagram")
    );

    if (!fbPub) {
      console.warn("[Shopify] Facebook & Instagram publication not found — skipping auto-publish");
      return;
    }

    publicationId = fbPub.node.id;
    if (!storeConfig) {
      _facebookPublicationId = publicationId;
    }
    console.log(`[Shopify] Found Facebook & Instagram publication: ${publicationId}`);
  }

  // Publish the product to the Facebook & Instagram channel
  const publishRes = await client.post("", {
    query: `mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          publishedOnCurrentChannel
        }
        userErrors {
          field
          message
        }
      }
    }`,
    variables: {
      id: shopifyProductGid,
      input: [{ publicationId }],
    },
  });

  const errors = publishRes.data?.data?.publishablePublish?.userErrors;
  if (errors?.length) {
    console.error("[Shopify] Failed to publish to Facebook & Instagram:", errors);
  } else {
    console.log(`[Shopify] Product ${shopifyProductGid} published to Facebook & Instagram`);
  }
}

// GET SHOPIFY PRODUCT STOREFRONT URL
export async function getShopifyProductStorefrontUrl(shopifyProductId) {
  try {
    if (!shopifyProductId) return null;

    const GET_PRODUCT_URL = `
      query getProductUrl($id: ID!) {
        product(id: $id) {
          handle
          onlineStoreUrl
        }
      }
    `;

    const response = await shopify.post("", {
      query: GET_PRODUCT_URL,
      variables: { id: shopifyProductId },
    });

    const product = response.data?.data?.product;
    if (!product) return null;

    let url = null;
    if (product.onlineStoreUrl) {
      url = product.onlineStoreUrl;
    } else if (product.handle && shopifyStoreDomain) {
      const storefrontDomain = process.env.SHOPIFY_STOREFRONT_DOMAIN || shopifyStoreDomain;
      url = `https://${storefrontDomain}/products/${product.handle}`;
    }
    if (!url) return null;

    // If the storefront is password-protected (Shopify's built-in launch
    // password), route through our own /go unlock page so whoever clicks
    // this link doesn't hit the password wall.
    const storefrontPassword = await getShopifyStorefrontPassword();
    return buildStorefrontLink(url, storefrontPassword);
  } catch (error) {
    console.error("Error fetching Shopify product URL:", error.message);
    return null;
  }
}

//  GET COLLECTION BY HANDLE/UUID
export async function getCollectionByHandle(handle) {
  try {
    const GET_COLLECTION = `
      query getCollection($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          title
          ruleSet {
            rules {
              column
              relation
              condition
            }
          }
        }
      }
    `;

    const response = await shopify.post("", {
      query: GET_COLLECTION,
      variables: { handle },
    });

    if (response.data.errors) {
      console.error("Collection fetch errors:", response.data.errors);
      return null;
    }

    const collection = response.data.data.collectionByHandle;

    if (!collection) {
      return null;
    }

    const isSmart =
      collection.ruleSet &&
      collection.ruleSet.rules &&
      collection.ruleSet.rules.length > 0;

    return {
      ...collection,
      isSmart,
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

// CREATE OR FIND SMART COLLECTION BY TAGS
// UNUSED — the only caller was removed from createShopifyProduct; see the note
// there. Kept for reference only. Do not call it: it writes to the base store
// regardless of which store the product belongs to, and its OR-over-tags rules
// generate near-duplicate collections. Deliberate placement belongs in the
// storeCollection path instead.
async function findOrCreateSmartCollectionByTags(tags, subcategory) {
  try {
    if (!tags || tags.length === 0) {
      return null;
    }

    // Search for existing collection with matching tag rules
    const existingCollection = await findCollectionByTags(tags);
    
    if (existingCollection) {
      return existingCollection.id;
    }

    // Create new smart collection
    // console.log(`Creating new smart collection for tags: ${tags.join(", ")}`);
    
    const collectionTitle = subcategory 
      ? `${subcategory} - ${tags.slice(0, 2).join(", ")}`
      : tags.slice(0, 3).join(" • ");

    const CREATE_SMART_COLLECTION = `
      mutation collectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            title
            handle
            ruleSet {
              appliedDisjunctively
              rules {
                column
                relation
                condition
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Create rules for each tag (OR logic - product needs ANY of these tags)
    const rules = tags.map(tag => ({
      column: "TAG",
      relation: "EQUALS",
      condition: tag
    }));

    const response = await shopify.post("", {
      query: CREATE_SMART_COLLECTION,
      variables: {
        input: {
          title: collectionTitle,
          ruleSet: {
            appliedDisjunctively: true, // OR logic
            rules: rules
          }
        }
      }
    });

    if (response.data.errors) {
      console.error("Error creating smart collection:", response.data.errors);
      return null;
    }

    const result = response.data.data.collectionCreate;
    
    if (result.userErrors?.length) {
      console.error("Smart collection user errors:", result.userErrors);
      return null;
    }

    // console.log(`Smart collection created: "${result.collection.title}"`);
    return result.collection.id;
    
  } catch (error) {
    console.error("Error in findOrCreateSmartCollectionByTags:", error);
    return null;
  }
}

// FIND COLLECTION BY TAGS
async function findCollectionByTags(tags) {
  try {
    const SEARCH_COLLECTIONS = `
      query {
        collections(first: 250, query: "collection_type:smart") {
          edges {
            node {
              id
              title
              handle
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await shopify.post("", { query: SEARCH_COLLECTIONS });
    
    if (response.data.errors || !response.data.data.collections) {
      return null;
    }
    
    const collections = response.data.data.collections.edges.map(e => e.node);
    
    // Find collection with matching tag rules
    return collections.find(col => {
      if (!col.ruleSet?.rules) return false;
      
      const collectionTags = col.ruleSet.rules
        .filter(r => r.column === "TAG" && r.relation === "EQUALS")
        .map(r => r.condition);
      
      // Check if all input tags are in collection rules
      return tags.every(tag => collectionTags.includes(tag)) &&
             tags.length === collectionTags.length;
    });
  } catch (error) {
    console.error("Error finding collection by tags:", error);
    return null;
  }
}

//  ADD PRODUCT TO COLLECTION
// export async function shopifyCollectionId(productId, collectionIdentifier) {
//   try {
//     let shopifyCollectionId = collectionIdentifier;
//     let collection = null;

//     if (!collectionIdentifier.startsWith("gid://")) {
//       console.log(
//         "Attempting to fetch collection by handle/UUID...",
//         collectionIdentifier,
//       );
//       collection = await getCollectionByHandle(collectionIdentifier);

//       if (!collection) {
//         console.log("❌ Collection not found. Skipping collection assignment.");
//         return { success: false, message: "Collection not found" };
//       }

//       shopifyCollectionId = collection.id;
//     } else {
//       const GET_COLLECTION_BY_ID = `
//         query getCollection($id: ID!) {
//           collection(id: $id) {
//             id
//             title
//             handle
//             ruleSet {
//               rules {
//                 column
//                 relation
//                 condition
//               }
//             }
//           }
//         }
//       `;

//       const response = await shopify.post("", {
//         query: GET_COLLECTION_BY_ID,
//         variables: { id: collectionIdentifier },
//       });

//       if (!response.data.errors && response.data.data.collection) {
//         collection = response.data.data.collection;
//         const isSmart =
//           collection.ruleSet &&
//           collection.ruleSet.rules &&
//           collection.ruleSet.rules.length > 0;
//         collection.isSmart = isSmart;
//       }
//     }

//     // Check if it's a smart collection
//     if (collection && collection.isSmart) {
//       console.log(
//         `"${collection.title}" is a SMART collection - products are added automatically based on rules:`,
//         JSON.stringify(collection.ruleSet.rules, null, 2)
//       );
//       return {
//         success: true,
//         isSmart: true,
//         message: "Smart collection - product will be added automatically if it matches the rules",
//         rules: collection.ruleSet.rules,
//       };
//     }

//     // If it's a manual collection, add the product
//     console.log(`Adding product to MANUAL collection: "${collection?.title || collectionIdentifier}"`);

//     const ADD_TO_COLLECTION = `
//       mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
//         collectionAddProducts(id: $id, productIds: $productIds) {
//           collection {
//             id
//             title
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     const response = await shopify.post("", {
//       query: ADD_TO_COLLECTION,
//       variables: { id: shopifyCollectionId, productIds: [productId] },
//     });

//     if (response.data.errors) {
//       console.error("❌ Collection error:", response.data.errors);
//       return { success: false, errors: response.data.errors };
//     }

//     const addResult = response.data.data.collectionAddProducts;

//     if (addResult.userErrors && addResult.userErrors.length) {
//       console.error("❌ Collection user errors:", addResult.userErrors);
//       return {
//         success: false,
//         userErrors: addResult.userErrors,
//       };
//     }
//     return { 
//       success: true, 
//       isSmart: false,
//       collection: addResult.collection 
//     };
//   } catch (error) {
//     console.error("❌ Error adding to collection:", error);
//     return { success: false, error: error.message };
//   }
// }

// BULK CREATE SHOPIFY PRODUCTS (on plan upgrade to Pro/Business)
export async function bulkCreateShopifyProducts(userId) {
  const mongoose = (await import("mongoose")).default;
  const Product =
    mongoose.models.Product ||
    (await import("@/models/Product")).default;

  const products = await Product.find({
    userId,
    $or: [
      { shopifyProductId: { $exists: false } },
      { shopifyProductId: null },
    ],
    collect: { $ne: true },
    sold: { $ne: true },
    archived: { $ne: true },
    pointsValue: null,
  });

  const results = { successful: 0, failed: 0, errors: [] };

  for (const product of products) {
    try {
      const shopifyResponse = await createShopifyProduct({
        title: product.title,
        sku: product.sku,
        brand: product.brand,
        description: product.description,
        price: product.price,
        images: product.images || [],
        color: product.color?.name || "No Color",
        size: product.size || [],
        fabric: product.fabric || "",
        subcategory: product.subcategory || "",
        tags: [],
        barcodeValue: product.barcode,
      });

      if (shopifyResponse.status === 200) {
        await Product.findByIdAndUpdate(product._id, {
          shopifyProductId: shopifyResponse.productId,
          shopifyVariantId: shopifyResponse.variantId,
          shopifyInventoryItemId: shopifyResponse.inventoryItemId,
        });
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          productId: product._id,
          error: shopifyResponse.error,
        });
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ productId: product._id, error: err.message });
    }

    // Rate limit: Shopify allows ~2 requests/second for GraphQL
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

// BULK REMOVE SHOPIFY PRODUCTS (on plan downgrade from Pro/Business)
export async function bulkRemoveShopifyProducts(userId) {
  const mongoose = (await import("mongoose")).default;
  const Product =
    mongoose.models.Product ||
    (await import("@/models/Product")).default;

  const products = await Product.find({
    userId,
    shopifyProductId: { $exists: true, $ne: null },
  });

  // Every product here belongs to `userId`, so one resolution covers the batch.
  const storeConfig = await resolveStoreConfigForUser(userId);

  const results = { successful: 0, failed: 0 };

  for (const product of products) {
    try {
      await deleteShopifyProduct([product], storeConfig);
      await Product.findByIdAndUpdate(product._id, {
        $unset: {
          shopifyProductId: "",
          shopifyVariantId: "",
          shopifyInventoryItemId: "",
        },
      });
      results.successful++;
    } catch (err) {
      results.failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

//  GET SHOPIFY LOCATIONS
export async function getShopifyLocations(storeConfig) {
  try {
    const { client } = buildShopifyClient(storeConfig);

    const GET_LOCATIONS = `
      query {
        locations(first: 10) {
          edges {
            node {
              id
              isActive
            }
          }
        }
      }
    `;

    const response = await client.post("", {
      query: GET_LOCATIONS,
    });

    if (response.data.errors) {
      console.error("Locations fetch errors:", response.data.errors);
      return [];
    }

    return response.data.data.locations.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

// GET ALL VARIANT INVENTORY ITEM IDS FOR A PRODUCT
export async function getAllVariantInventoryIds(shopifyProductId) {
  try {
    const GET_VARIANTS = `
      query getProductVariants($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            edges {
              node {
                id
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
    `;

    const response = await shopify.post("", {
      query: GET_VARIANTS,
      variables: { id: shopifyProductId },
    });

    if (response.data.errors || !response.data.data?.product?.variants) {
      console.error("Error fetching variant inventory IDs:", response.data.errors);
      return [];
    }

    const variants = response.data.data.product.variants.edges || [];
    return variants
      .map(({ node }) => node.inventoryItem?.id)
      .filter(Boolean);
  } catch (error) {
    console.error("Error in getAllVariantInventoryIds:", error);
    return [];
  }
}

// These two calls run AFTER the product already exists on Shopify but BEFORE it
// is saved to our database, so a hung connection here would leave a product on
// Shopify that we never recorded. The axios clients carry no timeout, so one is
// set per-request on these calls only — deliberately not on the shared client,
// which would change the behaviour of every other Shopify call in this file.
const COLLECTION_CALL_TIMEOUT_MS = 15000;

/**
 * Puts an already-created Shopify product into one collection on the owner's
 * own store.
 *
 * Safe by construction — it can never break a product that has already been
 * created:
 *   - it never throws; every outcome is a returned status
 *   - it reads the collection from the OWNER'S client, so a collection id that
 *     doesn't belong to this store simply isn't found and is skipped
 *   - it re-reads `ruleSet` LIVE rather than trusting anything stored, because
 *     a collection can be switched between manual and automated in Shopify at
 *     any time after we saved it
 *
 * An automated (smart) collection is deliberately skipped: Shopify rejects
 * collectionAddProducts on one, and it populates itself from the product's tags,
 * which are already sent on create.
 *
 * Note on "added": Shopify returns success with no userErrors even for a product
 * id that doesn't exist (verified against a live store — the collection's count
 * was unchanged). So "added" means "Shopify accepted the call", not "verified
 * present". That's fine here because the only caller passes an id it just
 * created, but don't read the status as proof of membership.
 *
 * @param {string} productId     Shopify product GID
 * @param {string} collectionId  Shopify collection GID
 * @param {object} [storeConfig] the owner's store; omitted -> base store
 * @returns {Promise<{status:"added"|"skipped"|"error", reason?:string, title?:string}>}
 */
export async function addProductToStoreCollection(productId, collectionId, storeConfig) {
  if (!productId || !collectionId) {
    return { status: "skipped", reason: "missing product or collection id" };
  }

  // Refuse to resolve a collection id against the BASE store. A storeCollection
  // can only originate from an OAuth store (getStoreCollectionsForUser returns
  // [] otherwise, so no dropdown is shown), which means a call arriving here
  // with no storeConfig is wrong by definition — either the submitted value was
  // tampered with, or store resolution degraded to the base store between
  // analysis and submit. Without this guard the id would be looked up on the
  // base store and, on a numeric collision, the product would be added to an
  // unrelated base-store collection.
  if (!storeConfig) {
    return {
      status: "skipped",
      reason: "no connected store — refusing to resolve a collection on the base store",
    };
  }

  try {
    const { client: shopify } = buildShopifyClient(storeConfig);

    // Live read. Also doubles as the ownership check: a collection belonging to
    // some other store is not visible through this store's token.
    const lookup = await shopify.post("", {
      query: `
        query collectionForAdd($id: ID!) {
          collection(id: $id) {
            id
            title
            ruleSet { appliedDisjunctively rules { column relation condition } }
          }
        }
      `,
      variables: { id: collectionId },
    }, { timeout: COLLECTION_CALL_TIMEOUT_MS });

    if (lookup.data.errors) {
      return {
        status: "error",
        reason: lookup.data.errors.map((e) => e.message).join("; "),
      };
    }

    const collection = lookup.data.data?.collection;
    if (!collection) {
      return {
        status: "skipped",
        reason: "collection not found on this store",
      };
    }

    // ruleSet present -> automated. It fills itself from the tags we already
    // send, and a direct write is rejected, so this is a success, not a failure.
    if (collection.ruleSet) {
      return {
        status: "skipped",
        reason: "automated collection — populated by its own tag rules",
        title: collection.title,
      };
    }

    const response = await shopify.post("", {
      query: `
        mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) {
            collection { id title }
            userErrors { field message }
          }
        }
      `,
      variables: { id: collectionId, productIds: [productId] },
    }, { timeout: COLLECTION_CALL_TIMEOUT_MS });

    if (response.data.errors) {
      return {
        status: "error",
        reason: response.data.errors.map((e) => e.message).join("; "),
        title: collection.title,
      };
    }

    const userErrors = response.data.data?.collectionAddProducts?.userErrors;
    if (userErrors?.length) {
      return {
        status: "error",
        reason: userErrors.map((e) => `${e.field}: ${e.message}`).join("; "),
        title: collection.title,
      };
    }

    return { status: "added", title: collection.title };
  } catch (error) {
    return {
      status: "error",
      reason: error?.response?.data?.errors
        ? JSON.stringify(error.response.data.errors)
        : error.message,
    };
  }
}

//  GET ALL COLLECTIONS
/**
 * Lists every collection on a store.
 *
 * @param {object} [storeConfig]  the owner's resolved store, from
 *   resolveStoreConfigForUser(). Omitted -> the shared base store, exactly as
 *   before (this function had no caller, so nothing changes for anyone).
 *
 * `ruleSet` is the only reliable way to tell a smart (automated) collection
 * from a manual one: Shopify returns null for a manual collection and a rule
 * list for an automated one. That distinction decides how a product gets into
 * the collection — a manual one needs an explicit collectionAddProducts call,
 * an automated one populates itself from the rules and must NOT be written to.
 * See CPH-CATEGORY-MAPPING.md §5.
 */
export async function getAllCollections(storeConfig) {
  try {
    // No storeConfig -> buildShopifyClient returns the base-store client.
    const { client: shopify } = buildShopifyClient(storeConfig);

    const GET_COLLECTIONS = `
      query getAllCollections($cursor: String) {
        collections(first: 250, after: $cursor) {
          edges {
            node {
              id
              title
              handle
              description
              updatedAt
              sortOrder
              productsCount {
                count
              }
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let allCollections = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const response = await shopify.post("", {
        query: GET_COLLECTIONS,
        variables: { cursor },
      });

      if (response.data.errors) {
        // Name the store and keep Shopify's own message — a per-store scope or
        // API-version problem is otherwise invisible here.
        console.error(
          `[shopify-collections] Fetch failed for ${storeConfig?.storeDomain || shopifyStoreDomain}:`,
          response.data.errors.map((e) => e.message).join("; ")
        );
        break;
      }

      const collectionsData = response.data.data.collections;

      allCollections.push(...collectionsData.edges.map((edge) => edge.node));

      hasNextPage = collectionsData.pageInfo.hasNextPage;
      cursor = collectionsData.pageInfo.endCursor;
    }

    return allCollections;
  } catch (error) {
    console.error(
      `[shopify-collections] Error fetching collections for ${storeConfig?.storeDomain || shopifyStoreDomain}:`,
      error?.response?.data?.errors || error.message
    );
    return [];
  }
}

//not working as expected - needs testing and fixing
export async function updateShopifyProduct(productId, formData, storeConfig) {
  try {
    // Shadow the module-level `shopify` with the owner's resolved per-store
    // client. No storeConfig -> base-store client, byte-identical to before.
    const { client: shopify } = buildShopifyClient(storeConfig);

    const {
      title,
      sku,
      brand,
      description,
      price,
      size,
      fabric,
      subcategory,
      // shopifyCollectionId,
      barcodeValue,
      pointsValue,
      storeName,
    } = formData;

    /* STEP 0: UPDATE METAFIELDS (points_value, store_label) if provided */
    if (pointsValue !== undefined) {
      await updateProductMetafield(productId, "custom", "points_value", String(pointsValue), "number_integer", storeConfig);
    }
    if (storeName) {
      await updateProductMetafield(productId, "custom", "store_label", storeName, "single_line_text_field", storeConfig);
    }

    /* STEP 1: FETCH PRODUCT */

    const GET_PRODUCT = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          options {
            id
            name
            position
            optionValues { name }
          }
          variants(first: 100) {
            edges {
              node {
                id
                selectedOptions { name value }
              }
            }
          }
        }
      }
    `;

    const productRes = await shopify.post("", {
      query: GET_PRODUCT,
      variables: { id: productId },
    });

    const product = productRes.data?.data?.product;
    if (!product) throw new Error("Product not found");

    /* STEP 2: UPDATE BASIC INFO */

    await shopify.post("", {
      query: `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            userErrors { message field }
          }
        }
      `,
      variables: {
        input: {
          id: productId,
          ...(title && { title }),
          ...(brand && { vendor: brand }),
          ...(subcategory && { productType: subcategory }),
          ...(description && { descriptionHtml: description }),
        },
      },
    });

    /* STEP 3: PREPARE DATA */

    const sizesArray = size
      ? Array.isArray(size)
        ? size
        : size.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const options = product.options.sort((a, b) => a.position - b.position);
    const colorOption = options.find(o => o.name === "Color");
    const sizeOption = options.find(o => o.name === "Size");
    const fabricOption = options.find(o => o.name === "Fabric");

    const currentSizes = sizeOption ? sizeOption.optionValues.map(v => v.name) : [];
    const currentFabric = fabricOption?.optionValues[0]?.name || null;

    const sizeChanged =
      JSON.stringify(currentSizes.sort()) !== JSON.stringify(sizesArray.sort());
    const fabricChanged = currentFabric !== (fabric || null);

    if (!sizeChanged && !fabricChanged) {
      
      if (price || barcodeValue) {
        const existingVariants = product.variants.edges;
        const updateVariants = existingVariants.map(v => ({
          id: v.node.id,
          ...(price && { price: parseFloat(price).toFixed(2) }),
          ...(barcodeValue && { barcode: barcodeValue }),
        }));

        await shopify.post("", {
          query: `
            mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                userErrors { message field }
              }
            }
          `,
          variables: {
            productId,
            variants: updateVariants,
          },
        });
      }
      
      // if (shopifyCollectionId) {
      //   await addProductToCollection(productId, shopifyCollectionId);
      // }
      
      return { status: 200, message: "Product updated (no variant change)" };
    }

    /* STEP 4: UPDATE/CREATE OPTIONS */

    const colorValues = colorOption 
      ? colorOption.optionValues.map(v => v.name)
      : ["Default"];

    // Update Size option
    if (sizeOption && sizeChanged) {
      await shopify.post("", {
        query: `
          mutation productOptionUpdate($productId: ID!, $option: OptionUpdateInput!) {
            productOptionUpdate(productId: $productId, option: $option) {
              userErrors { message field }
            }
          }
        `,
        variables: {
          productId,
          option: {
            id: sizeOption.id,
            values: sizesArray.map(s => ({ name: s })),
          },
        },
      });
      
      await new Promise(r => setTimeout(r, 1000));
    }

    // Create or update Fabric option
    if (fabric) {
      if (fabricOption) {
        if (fabricChanged) {
          await shopify.post("", {
            query: `
              mutation productOptionUpdate($productId: ID!, $option: OptionUpdateInput!) {
                productOptionUpdate(productId: $productId, option: $option) {
                  userErrors { message field }
                }
              }
            `,
            variables: {
              productId,
              option: {
                id: fabricOption.id,
                values: [{ name: fabric }],
              },
            },
          });
          
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
        // Create Fabric option if it doesn't exist
        await shopify.post("", {
          query: `
            mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
              productOptionsCreate(productId: $productId, options: $options) {
                userErrors { message field }
              }
            }
          `,
          variables: {
            productId,
            options: [
              {
                name: "Fabric",
                values: [{ name: fabric }],
              },
            ],
          },
        });
        
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Wait for all option updates to propagate
    await new Promise(r => setTimeout(r, 2000));

    /* STEP 5: REFETCH PRODUCT */

    const refetchRes = await shopify.post("", {
      query: GET_PRODUCT,
      variables: { id: productId },
    });

    const refetchedProduct = refetchRes.data?.data?.product;
    if (!refetchedProduct) {
      throw new Error("Failed to refetch product");
    }

    /* STEP 6: DELETE OLD VARIANTS & CREATE NEW ONES */

    const existingVariants = refetchedProduct.variants.edges;
    const keepVariantId = existingVariants[0].node.id;
    const deleteIds = existingVariants.slice(1).map(v => v.node.id);

    // Delete all but one variant
    if (deleteIds.length > 0) {
      await shopify.post("", {
        query: `
          mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
            productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
              userErrors { message field }
            }
          }
        `,
        variables: {
          productId,
          variantsIds: deleteIds,
        },
      });

      await new Promise(r => setTimeout(r, 2000));
    }

    /* STEP 7: CREATE ALL NEW VARIANTS */

    const allVariants = [];
    
    for (const color of colorValues) {
      for (let i = 0; i < (sizesArray.length || 1); i++) {
        const sizeVal = sizesArray[i];

        const optionValues = [{ optionName: "Color", name: color }];

        if (sizeVal) {
          optionValues.push({ optionName: "Size", name: sizeVal });
        }

        if (fabric) {
          optionValues.push({ optionName: "Fabric", name: fabric });
        }

        const payload = { optionValues };

        if (price) payload.price = parseFloat(price).toFixed(2);

        if (sku) {
          let variantSku = sku;
          if (sizeVal) variantSku += `-${sizeVal}`;
          if (color !== "Default") variantSku += `-${color}`;
          
          payload.inventoryItem = { sku: variantSku };
        }

        if (barcodeValue) payload.barcode = barcodeValue;

        allVariants.push(payload);
      }
    }

    const createRes = await shopify.post("", {
      query: `
        mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkCreate(productId: $productId, variants: $variants) {
            productVariants {
              id
              inventoryItem { id }
            }
            userErrors { message field }
          }
        }
      `,
      variables: {
        productId,
        variants: allVariants,
      },
    });

    const createData = createRes.data?.data?.productVariantsBulkCreate;
    const createErrors = createData?.userErrors;

    if (createErrors && createErrors.length > 0) {
      console.error("Variant creation errors:", createErrors);
      throw new Error(`Failed to create variants: ${createErrors.map(e => e.message).join(", ")}`);
    }

    const created = createData?.productVariants || [];

    if (!created.length) {
      throw new Error("No variants were created");
    }

    // Wait for variants to be created
    await new Promise(r => setTimeout(r, 2000));

    // Set inventory to 1 for each new variant (prevents inventory resetting to 0)
    let locationId = null;
    try {
      const locations = await getShopifyLocations(storeConfig);
      const activeLocation = locations.find((l) => l.isActive);
      locationId = activeLocation?.id;
    } catch (error) {
      console.warn("Could not fetch locations for inventory update:", error.message);
    }

    if (locationId) {
      for (const variant of created) {
        try {
          await shopify.post("", {
            query: `
              mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
                inventoryItemUpdate(id: $id, input: $input) {
                  inventoryItem { id tracked }
                  userErrors { field message }
                }
              }
            `,
            variables: {
              id: variant.inventoryItem.id,
              input: { tracked: true },
            },
          });

          await updateInventory(variant.inventoryItem.id, locationId, 1, storeConfig);
        } catch (invError) {
          console.error(
            `Error setting inventory for variant ${variant.id}:`,
            invError.message,
          );
        }
      }
    }

    /* STEP 8: DELETE THE OLD KEPT VARIANT */

    await shopify.post("", {
      query: `
        mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
          productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
            userErrors { message field }
          }
        }
      `,
      variables: {
        productId,
        variantsIds: [keepVariantId],
      },
    });

    /* STEP 9: COLLECTION */

    // if (shopifyCollectionId) {
    //   await addProductToCollection(productId, shopifyCollectionId);
    // }

    return {
      status: 200,
      message: "Product updated successfully",
      productId,
      variantsCreated: created.length,
    };
  } catch (error) {
    console.error("❌ Shopify Update Error:", error);
    return { status: 500, error: error.message };
  }
}