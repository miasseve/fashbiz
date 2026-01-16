"use server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import axios from "axios";
import Cart from "@/models/Cart";
import Account from "@/models/Account";
import { user } from "@heroui/theme";

export async function createProduct(formData) {
  try {
    const session = await auth();

    if (!session) {
      return { status: 400, error: "User is not authenticated" };
    }

    const {
      title,
      sku,
      brand,
      description,
      price,
      images,
      firstName,
      lastName,
      email,
      accountId,
      color,
      subcategory,
      collectionId,
      collect,
      size,
      fabric,
      pointsValue = null,
    } = formData;

    await dbConnect();
    const formattedPrice = Number(parseFloat(price).toFixed(2));
    let productId = null;
    let brandPrice = null;
    let isDemo = false;
    const sizesArray = Array.isArray(size) ? size : [size]; // ["S","M","L"] or [28,30]
    // Generate Barcode Value
    const year = new Date().getFullYear().toString().slice(-2);
    const brandCode = brand
      ? brand
          .replace(/[^A-Za-z0-9]/g, "")
          .toUpperCase()
          .slice(0, 3)
      : "XXX";
    const barcodeValue = `REE-${brandCode}${sku}${year}`;
    const demoAccount = await Account.findOne({
      userId: session.user.id,
      mode: "demo",
    });
    if (demoAccount) {
      const demoProductCount = await Product.countDocuments({
        userId: session.user.id,
        isDemo: true,
      });
      isDemo = true;
      if (demoProductCount >= demoAccount?.demoProductLimit) {
        return {
          status: 400,
          error: `Demo product limit of ${demoAccount.demoProductLimit} reached.`,
        };
      }
    }

    if (collect === true) {
      const userId = await User.findOne({ brandname: brand }).select("_id");
      const reeamt = await Account.findOne({ userId: userId?._id }).select(
        "reeCollectAmount"
      );
      brandPrice = reeamt
        ? Number(parseFloat(reeamt?.reeCollectAmount).toFixed(2))
        : null;
    }

    // Only create product in Wix if collect is false
    if (collect === false && pointsValue == null) {
      // Build product options array dynamically
      const productOptions = [];

      // Add Color option
      if (color) {
        productOptions.push({
          name: "Color",
          choices: [
            {
              value: color.name || "N/A",
              description: color.name || color.hex || "N/A",
            },
          ],
        });
      }

      // Add Size option
      if (size) {
        // Split size if multiple sizes are provided (e.g., "S, M, L")
        const sizes = size
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        if (sizes.length > 0) {
          productOptions.push({
            name: "Size",
            choices: sizes.map((s) => ({
              value: s,
              description: s,
            })),
          });
        }
      }

      // Add Fabric option
      if (fabric) {
        productOptions.push({
          name: "Fabric",
          choices: [
            {
              value: fabric,
              description: fabric,
            },
          ],
        });
      }

      // Construct product data for Wix API
      const productData = {
        product: {
          name: title,
          productType: "physical",
          priceData: { price: formattedPrice },
          description: `${description}\n\nSubcategory: ${subcategory}`,
          sku: sku,
          visible: true,
          manageVariants: true,
          productOptions:
            productOptions.length > 0 ? productOptions : undefined,
        },
      };

      try {
        // Create product in Wix
        const response = await axios.post(
          "https://www.wixapis.com/stores/v1/products",
          productData,
          {
            headers: {
              Authorization: `Bearer ${process.env.WIX_API_KEY}`,
              "wix-site-id": process.env.WIX_SITE_ID,
              "Content-Type": "application/json",
            },
          }
        );

        productId = response.data.product.id;

        // Add images to product
        const productImages = {
          media: images.map((image) => ({ url: image.url })),
        };

        await axios.post(
          `https://www.wixapis.com/stores/v1/products/${productId}/media`,
          productImages,
          {
            headers: {
              Authorization: `Bearer ${process.env.WIX_API_KEY}`,
              "wix-site-id": process.env.WIX_SITE_ID,
              "Content-Type": "application/json",
            },
          }
        );

        if (collectionId) {
          await axios.post(
            `https://www.wixapis.com/stores/v1/collections/${collectionId}/productIds`,
            {
              productIds: [productId],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.WIX_API_KEY}`,
                "wix-site-id": process.env.WIX_SITE_ID,
                "Content-Type": "application/json",
              },
            }
          );
        }
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response;
          if (
            status === 400 &&
            data?.message === "requirement failed: product.sku is not unique"
          ) {
            return { status: 400, error: "SKU already exists" };
          } else {
            return { status: 400, error: data?.message };
          }
        } else {
          return {
            status: 400,
            error: error.response?.data?.message || error?.message,
          };
        }
      }
    }

    // Save product in MongoDB (always happens regardless of collect value)
    const newProduct = new Product({
      sku,
      title,
      brand,
      subcategory,
      category: collectionId,
      description,
      color,
      price: formattedPrice,
      pointsValue: pointsValue,
      images,
      brandPrice: brandPrice,
      userId: session.user.id,
      consignorName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
      consignorEmail: email ?? "",
      consignorAccount: accountId ?? "",
      wixProductId: productId, // Will be null if collect === true
      collect: collect ?? false,
      size,
      fabric,
      barcode: barcodeValue,
      isDemo: isDemo,
    });

    await newProduct.save();

    const user = await User.findById(session.user.id);
    if (user) {
      user.products.push(newProduct._id);
      await user.save();
    }

    const link =
      process.env.NODE_ENV === "development"
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/product/${newProduct._id}`
        : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/product/${newProduct._id}`;

    return {
      status: 200,
      message:
        collect === false
          ? "Product created successfully and added to collection"
          : "Product saved successfully (Wix creation skipped)",
      data: link,
    };
  } catch (error) {
    return { status: 500, error: error.message || "Failed to create product" };
  }
}

export async function getUserProducts() {
  try {
    // Authenticate and get the session
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }
    // Connect to the database
    await dbConnect();

    // Fetch products for the authenticated user
    let userProducts = [];
    if (session.user.role === "store") {
      userProducts = await Product.find({
        userId: session.user.id,
        sold: false,
        collect: { $ne: true },
      }).sort({
        createdAt: -1,
      });
    } else {
      const userbrand = await User.findById(session.user.id).select(
        "brandname"
      );
      userProducts = await Product.find({
        brand: userbrand.brandname,
        collect: { $eq: true },
      }).sort({
        createdAt: -1,
      });
    }
    return { status: 200, products: JSON.stringify(userProducts) }; // Return the user's products
  } catch (error) {
    return { status: 500, error: error.message || "Failed to fetch products" };
  }
}

export async function getProductsByEmail(email) {
  try {
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }
    await dbConnect();
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const products = await Product.find({ consignorEmail: email }).sort({
      createdAt: -1,
    });

    return {
      status: 200,
      products: JSON.stringify(products),
    };
  } catch (error) {
    return {
      status: 500,
      error: "Failed to fetch products",
    };
  }
}
export async function getUserProductsSold() {
  try {
    // Authenticate and get the session
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();
    let userProducts = [];
    // Fetch products for the authenticated user
    if (session.user.role == "store") {
      userProducts = await Product.find({
        userId: session.user.id,
        sold: true,
      }).sort({
        createdAt: -1,
      });
    } else {
      userProducts = await Product.find({
        consignorEmail: session.user.email,
        sold: true,
      }).sort({
        createdAt: -1,
      });
    }
    return {
      status: 200,
      products: JSON.stringify(userProducts),
    };
  } catch (error) {
    return {
      status: 500,
      message: error.message || "Something went wrong",
    };
  }
}

export async function deleteProductsFromWix(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return;
  }

  // Loop through the products array and delete each product using its wixProductId
  for (const product of products) {
    const { wixProductId } = product;
    try {
      const getResponse = await axios.get(
        `https://www.wixapis.com/stores/v1/products/${wixProductId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );
      if (getResponse.status === 200) {
        try {
          await axios.delete(
            `https://www.wixapis.com/stores/v1/products/${wixProductId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
                "wix-site-id": process.env.WIX_SITE_ID,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (error) {
          console.error("Error deleting product:", error);
        }
      }
    } catch (error) {
      return true;
    }
  }
}

export async function getUserProductCount() {
  try {
    // Authenticate and get the session
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    await dbConnect();
    let demoLimitReached = false;
    const demoAccount = await Account.findOne({
      userId: session.user.id,
      mode: "demo",
    });
    if (demoAccount) {
      const demoProductCount = await Product.countDocuments({
        userId: session.user.id,
        isDemo: true,
      });
      demoLimitReached =
        demoProductCount >= demoAccount.demoProductLimit;

      return {
        status: 200,
        count: demoProductCount,
        isDemo: true,
        demoLimitReached,
      };
    }
    const productCount = await Product.countDocuments({
      userId: session.user.id,
    });

    return { status: 200, count: productCount , isDemo: false,demoLimitReached};
  } catch (error) {
    return { status: 500, error: "Failed to fetch count" };
  }
}

export async function getProductById(productId) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();
    // Fetch the product by ID for the authenticated user
    const product = await Product.findOne({
      _id: productId,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (session.user.role === "store") {
      if (product.userId.toString() !== session.user.id.toString()) {
        throw new Error("You are not authorized to view this product");
      }
    }

    const user = await User.findOne(
      { email: product.consignorEmail },
      "firstname lastname email address phoneNumber city"
    );

    if (session.user.role === "brand") {
      const userBrand = await User.findById(session.user.id).select(
        "brandname"
      );
      if (product.brand !== userBrand.brandname) {
        throw new Error("You are not authorized to view this product");
      }
    }

    // if (!user) {
    //   throw new Error("User related to the product not found");
    // }
    return {
      status: 200, // Success status code
      message: "Product fetched successfully",
      data: {
        product: JSON.stringify(product),
        user: JSON.stringify(user),
        userRole: session.user.role,
      },
    }; // Return the product details
  } catch (error) {
    return {
      status: 500, // Internal server error status code
      error: error.message || "Failed to fetch product",
    };
  }
}

export async function deleteProductByIdAndWix(
  product,
  { deleteDb = true, deleteWix = true } = {}
) {
  const { _id, wixProductId } = product;
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();

    // Check if the product exists before attempting to delete
    const product = await Product.findById(_id);
    if (!product) {
      throw new Error("Product not found.");
    }

    if (product.userId.toString() !== session.user.id) {
      throw new Error("You do not have permission to delete this product.");
    }
    if (deleteDb) {
      // Delete the product by ID
      await Product.deleteOne({ _id });
    }

    if (deleteWix && wixProductId) {
      try {
        const getResponse = await axios.get(
          `https://www.wixapis.com/stores/v1/products/${wixProductId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.WIX_API_KEY}`,
              "wix-site-id": process.env.WIX_SITE_ID,
              "Content-Type": "application/json",
            },
          }
        );
        if (getResponse.status === 200) {
          await axios.delete(
            `https://www.wixapis.com/stores/v1/products/${wixProductId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
                "wix-site-id": process.env.WIX_SITE_ID,
                "Content-Type": "application/json",
              },
            }
          );
        }
        await Product.updateOne({ _id }, { $unset: { wixProductId: "" } });
      } catch (error) {
        console.log(error, "error");
      }
    }
    return {
      status: 200,
      message: deleteWix
        ? "Product deleted and unlinked from Wix"
        : "Product deleted successfully",
    };
  } catch (error) {
    return { status: 500, error: error.message || "Something went wrong" };
  }
}

export async function unlinkProductFromWix(productIds) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }
    // Connect to the database
    await dbConnect();
    //get wixproductid from productid
    for (const productId of productIds) {
      const product = await Product.findById(productId).select("wixProductId");
      if (product?.wixProductId) {
        try {
          await axios.delete(
            `https://www.wixapis.com/stores/v1/products/${product?.wixProductId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
                "wix-site-id": process.env.WIX_SITE_ID,
                "Content-Type": "application/json",
              },
            }
          );
          await Product.updateOne(
            { _id: productId },
            { $unset: { wixProductId: "" } }
          );
        } catch (error) {
          console.log(error, "error");
        }
      }
    }
    return { status: 200, message: "Products unlinked successfully" };
  } catch (error) {
    console.log(error, "error");
  }
}

export async function deleteProductById(productId) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();

    // Check if the product exists before attempting to delete
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    if (
      session.user.role === "store" &&
      product.userId.toString() !== session.user.id
    ) {
      throw new Error("You do not have permission to delete this product.");
    }
    // Delete the product by ID
    await Product.deleteOne({ _id: productId });

    return { status: 200, message: "Product deleted successfully." };
  } catch (error) {
    return { status: 500, error: error.message || "Something went wrong" };
  }
}

export async function updateProduct(productId, data) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    await dbConnect();

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    // Ensure logged-in user owns this product
    if (product.userId.toString() !== session.user.id) {
      throw new Error("You do not have permission to update this product.");
    }

    // Update product in MongoDB
    await Product.updateOne({ _id: productId }, { $set: data });

    // Update product in Wix if it has a wixProductId
    if (product.wixProductId) {
      try {
        // Build product options array dynamically for Wix update
        const productOptions = [];

        // Add Color option (use existing color from product if not in update data)
        const currentColor = data.color || product.color;
        if (currentColor) {
          productOptions.push({
            name: "Color",
            choices: [
              {
                value: currentColor.name || "N/A",
                description: currentColor.name || currentColor.hex || "N/A",
              },
            ],
          });
        }

        // Add Size option
        const currentSize = data.size || product.size;
        if (currentSize) {
          // Split size if multiple sizes are provided (e.g., "S, M, L" or "38, 40, 42")
          const sizes = currentSize
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          if (sizes.length > 0) {
            productOptions.push({
              name: "Size",
              choices: sizes.map((s) => ({
                value: s,
                description: s,
              })),
            });
          }
        }

        // Add Fabric option
        const currentFabric = data.fabric || product.fabric;
        if (currentFabric) {
          productOptions.push({
            name: "Fabric",
            choices: [
              {
                value: currentFabric,
                description: currentFabric,
              },
            ],
          });
        }

        // Construct update data for Wix
        const productData = {
          product: {
            name: data.title || product.title,
            priceData: {
              price: data.price || product.price,
            },
            description: data.description || product.description,
            sku: data.sku || product.sku,
          },
        };

        // Only add productOptions if we have any
        if (productOptions.length > 0) {
          productData.product.productOptions = productOptions;
          productData.product.manageVariants = true;
        }

        // Update product in Wix
        await axios.patch(
          `https://www.wixapis.com/stores/v1/products/${product.wixProductId}`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${process.env.WIX_API_KEY}`,
              "wix-site-id": process.env.WIX_SITE_ID,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.log(error, "error updating Wix product");
        return {
          status: 500,
          error: "Product updated in DB but failed to update in Wix.",
        };
      }
    }

    return { status: 200, message: "Product updated successfully" };
  } catch (error) {
    return { status: 500, error: error.message || "Something went wrong" };
  }
}

export async function soldProductsByIds(productIds) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    await dbConnect();

    // Ensure the array is not empty
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return {
        status: 400,
        message: "Products not exist",
      };
    }

    // Delete the products with the given IDs
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { sold: true } }
    );

    if (result.modifiedCount === 0) {
      return {
        status: 400,
        message: "No products were updated",
      };
    }
    return {
      status: 200,
      message: "Products status updated to sold successfully",
    };
  } catch (error) {
    return {
      status: 500,
      error: "Something went wrong",
    };
  }
}

export async function addProductToCart(product) {
  try {
    const session = await auth();

    if (!session) {
      return { status: 400, error: "User is not authenticated" };
    }
    const userId = session.user.id;
    await dbConnect();
    const { productId, title, price } = product;
    if (!productId || !title || !price) {
      return { status: 400, message: "Missing required fields" };
    }
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart if none exists
      cart = new Cart({
        userId,
        items: [{ productId, title, price }],
        total: price,
      });
    } else {
      // Check if product already exists in cart
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        return { status: 200, message: "Product already in cart" };
      } else {
        // Add new item
        cart.items.push({ productId, title, price });
        cart.total += price;
      }
    }

    await cart.save();
    return { message: "Product added to cart successfully", status: 200 };
  } catch (error) {
    return {
      error: error.message || "Failed to add product to cart",
      status: 500,
    };
  }
}

export async function getProductfromCart() {
  try {
    const session = await auth();

    if (!session) {
      return { status: 401, error: "User is not authenticated" };
    }

    await dbConnect();

    const userId = session.user.id;
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        model: Product,
        select: "title price images total",
      })
      .lean();

    if (!cart) {
      return { status: 404, message: "Cart not found" };
    }

    return {
      status: 200,
      data: JSON.parse(JSON.stringify(cart)),
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message || "Failed to fetch cart",
    };
  }
}

export async function removeProductfromCart(productId) {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, message: "User not authenticated" };
    }

    const userId = session.user.id;

    if (!productId) {
      return { status: 400, message: "Product ID is required" };
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return { status: 404, message: "Cart not found" };
    }

    // Find item index in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return { status: 404, message: "Product not found in cart" };
    }

    // Remove item and update total
    const removedItem = cart.items[itemIndex];
    cart.total -= removedItem.price;
    cart.items.splice(itemIndex, 1);

    await cart.save();
    return {
      message: "Product removed successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return {
      error: error.message || "Failed to remove item",
      status: 200,
    };
  }
}

export async function clearCartOnCheckout() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, message: "User not authenticated" };
    }

    const userId = session.user.id;

    await dbConnect();

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return { status: 404, message: "Cart not found" };
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();
    return {
      message: "All Products removed successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error clearing cart after checkout:", error);
    return {
      error: error.message || "Failed to clear cart",
      status: 200,
    };
  }
}

export async function archiveProduct(userId) {
  await dbConnect();

  // Find all active (non-archived) products for this user
  const products = await Product.find({
    userId: userId,
    archived: { $ne: true },
  });

  if (!products.length) {
    return { status: 200, message: "No active products to archive" };
  }

  const results = [];

  // 2 Loop through each product and archive it in Wix + DB
  for (const product of products) {
    try {
      await Product.updateMany(
        { archived: { $exists: false } },
        { $set: { archived: false } }
      );
      console.log(
        "product.title",
        product.title,
        "product.wixProductId",
        product.wixProductId,
        "product.sku",
        product.sku
      );
      if (!product.wixProductId) {
        results.push({
          productId: product._id.toString(),
          wixProductId: null,
          success: false,
          error: "Missing wixProductId",
        });
        continue;
      }
      // 2a. Hide product in Wix
      const result = await axios.patch(
        `https://www.wixapis.com/stores/v1/products/${product.wixProductId}`,
        {
          product: {
            visible: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );

      // Update in MongoDB
      if (result.status === 200) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id },
          { archived: true },
          { new: true }
        );
      }

      results.push({
        productId: product._id.toString(),
        wixProductId: product.wixProductId,
        success: true,
      });
    } catch (error) {
      console.error(`Error archiving product ${product._id}:`, error.message);
      results.push({
        productId: product._id.toString(),
        wixProductId: product.wixProductId,
        success: false,
        error: error.message,
      });
    }
  }
  return {
    status: 200,
    message: "Archiving process completed",
    results,
  };
}

export async function unarchiveProduct(userId) {
  await dbConnect();

  //Find all archived products for this user
  const products = await Product.find({
    userId: userId,
    archived: true,
  });

  if (!products.length) {
    return { status: 200, message: "No archived products to unarchive" };
  }

  const results = [];

  // 2Loop through and make each product visible again
  for (const product of products) {
    try {
      if (!product.wixProductId) {
        results.push({
          productId: product._id.toString(),
          wixProductId: null,
          success: false,
          error: "Missing wixProductId",
        });
        continue;
      }
      // Update visibility in Wix
      await axios.patch(
        `https://www.wixapis.com/stores/v1/products/${product.wixProductId}`,
        {
          product: {
            visible: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        "Unarchiving product:",
        product.title,
        "Wix ID:",
        product.wixProductId
      );

      //  Update in MongoDB
      await Product.findOneAndUpdate(
        { _id: product._id },
        { archived: false },
        { new: true }
      );

      results.push({
        productId: product._id.toString(),
        wixProductId: product.wixProductId,
        success: true,
      });
    } catch (error) {
      // console.error(`Error unarchiving product ${product._id}:`, error.message);
      results.push({
        productId: product._id.toString(),
        wixProductId: product.wixProductId,
        success: false,
        error: error.message,
      });
    }
  }
  return {
    status: 200,
    message: "Unarchiving process completed",
    results,
  };
}

export async function getCollectProducts() {
  try {
    // Authenticate and get the session
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }
    // Connect to the database
    await dbConnect();

    // Fetch products for the authenticated user
    if (session.user.role === "store") {
      const collectProducts = await Product.find({
        userId: session.user.id,
        sold: false,
        collect: true,
      }).sort({
        createdAt: -1,
      });

      return { status: 200, products: JSON.stringify(collectProducts) };
    } else if (session.user.role === "brand") {
      const userbrand = await User.findById(session.user.id).select(
        "brandname"
      );
      const collectProducts = await Product.find({
        brand: userbrand.brandname,
        collect: true,
      })
        .populate("userId", "storename brandname")
        .sort({
          createdAt: -1,
        });
      return { status: 200, products: JSON.stringify(collectProducts) };
    }
  } catch (error) {
    return { status: 500, error: error.message || "Failed to fetch products" };
  }
}

export async function getCollectStoreOrBrandNames() {
  try {
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }

    await dbConnect();
    let FilterList = [];
    const userRole = session.user.role;

    if (userRole === "store") {
      // Get distinct brand names for store users
      const brandNames = await Product.distinct("brand", {
        userId: session.user.id,
        collect: true,
      });
      FilterList = brandNames;
    } else if (userRole === "brand") {
      // Get distinct store names for brand users
      const storeNames = await User.find(
        {
          _id: {
            $in: await Product.distinct("userId", {
              brand: (
                await User.findById(session.user.id).select("brandname")
              ).brandname,
              collect: true,
            }),
          },
        },
        "storename"
      );
      FilterList = storeNames.map((store) => store.storename);
    }
    return {
      FilterList,
      userRole,
    };
  } catch (error) {
    console.error("Error fetching store or brand names:", error);
    return [];
  }
}
