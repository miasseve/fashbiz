/**
 * Add-on feature configuration for pay-per-product (no subscription) users.
 */

export const ADD_ONS = {
  complete_adds: {
    key: "complete_adds",
    label: "Complete Adds",
    description: "Upload product with AI details, consignor linking & split payments",
    price: 10, // DKK
    required: true,
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    description: "Post product directly to your Instagram account",
    price: 10,
    required: false,
  },
  webstore: {
    key: "webstore",
    label: "Webstore (Pay Once)",
    description: "List product on your Shopify webstore",
    price: 4800,
    required: false,
  },
  plugin: {
    key: "plugin",
    label: "Plug In (Pay Once)",
    description: "Connect your Existing webstore",
    price: 3200,
    required: false,
  },
};

export const ADD_ON_KEYS = Object.keys(ADD_ONS);

export function calculateTotal(selectedAddOns) {
  return selectedAddOns.reduce((sum, key) => {
    const addon = ADD_ONS[key];
    return sum + (addon ? addon.price : 0);
  }, 0);
}
