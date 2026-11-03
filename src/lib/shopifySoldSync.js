// Hides a sold product on the Shopify store it actually lives on: stock 0 at
// its location, then status DRAFT. Used by the Shopify order webhook and by
// "mark sold" in leStores, so both act on the owner's own connected store
// instead of always on the base store.
//
// NOTE: not a "use server" module — server-side callers only.
import { resolveStoreConfigForUser } from "@/lib/shopifyStoreResolver";
import {
  updateInventory,
  getShopifyLocations,
  disableShopifyProduct,
  getAllVariantInventoryIds,
} from "@/actions/shopifyAction";

/**
 * @param {object} product  a Product document (needs userId, shopifyProductId)
 * @returns {Promise<{ storeDomain: string|null, hidden: boolean }>}  never throws
 */
export async function hideSoldProductOnShopify(product) {
  const storeConfig = await resolveStoreConfigForUser(product?.userId);
  const storeDomain = storeConfig?.storeDomain || process.env.SHOPIFY_STORE_DOMAIN || null;

  if (!product?.shopifyProductId) return { storeDomain, hidden: false };

  try {
    let locationId = product.shopifyLocationId || storeConfig?.defaultLocationId || null;
    if (!locationId) {
      const locations = await getShopifyLocations(storeConfig);
      locationId = locations.find((l) => l.isActive)?.id || null;
    }

    if (locationId) {
      let inventoryItemIds = await getAllVariantInventoryIds(
        product.shopifyProductId,
        storeConfig
      );
      if (!inventoryItemIds.length && product.shopifyInventoryItemId) {
        inventoryItemIds = [product.shopifyInventoryItemId];
      }
      for (const inventoryItemId of inventoryItemIds) {
        await updateInventory(inventoryItemId, locationId, 0, storeConfig);
      }
    } else {
      console.warn(`[shopifySoldSync] No location for product ${product._id} — stock not zeroed`);
    }

    const result = await disableShopifyProduct(product.shopifyProductId, storeConfig);
    return { storeDomain, hidden: result?.success === true };
  } catch (error) {
    console.error(
      `[shopifySoldSync] Failed to hide sold product ${product._id} on ${storeDomain}:`,
      error.message
    );
    return { storeDomain, hidden: false };
  }
}
