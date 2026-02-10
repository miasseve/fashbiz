"use server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import axios from "axios";
import Cart from "@/models/Cart";
import Account from "@/models/Account";
import {
  updateShopifyProduct,
  createShopifyProduct,
  deleteShopifyProduct,
} from "./shopifyAction";
import InstagramPostLog from "@/models/InstagramPostLogs";
// import {
//   createWixProduct,
//   unlinkWixProduct,
//   deleteWixProduct,
//   updateWixProduct,
//   archiveWixProduct,
//   unarchiveWixProduct
// } from "./wixActions";

export async function createProduct(formData) {
  let createdShopifyProduct = false;
  let shopifyProductId = null;
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
      // collectionId,
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
        "reeCollectAmount",
      );
      brandPrice = reeamt
        ? Number(parseFloat(reeamt?.reeCollectAmount).toFixed(2))
        : null;
    }

    // Only create product in Wix if collect is false
    if (collect === false && pointsValue == null) {
      try {
        // Create product in Shopify
        const shopifyResponse = await createShopifyProduct({
          ...formData,
          barcodeValue,
        });
        if (shopifyResponse.status === 200) {
          shopifyProductId = shopifyResponse.productId;
          createdShopifyProduct = true;
        }
        // Create product in Wix
        // const wixResult = await createWixProduct({
        //   title,
        //   description,
        //   formattedPrice,
        //   sku,
        //   images,
        //   color,
        //   size,
        //   fabric,
        //   subcategory,
        //   collectionId,
        // });

        // productId = wixResult.productId;
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
      category: "Uncategorized",
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
      shopifyProductId: shopifyProductId,
    });

    await newProduct.save();

    await User.findByIdAndUpdate(session.user.id, {
      $push: { products: newProduct._id },
    });

    const link =
      process.env.NODE_ENV === "development"
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/product/${newProduct._id}`
        : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/product/${newProduct._id}`;

    return {
      status: 200,
      message:
        collect === false
          ? "Product created successfully and added to collection"
          : "Product saved successfully (Shopify creation skipped)",
      data: {
        link,
        product: JSON.stringify(newProduct),
      },
    };
  } catch (error) {
    if (createdShopifyProduct && shopifyProductId) {
      try {
        await deleteShopifyProduct(shopifyProductId);
      } catch (rollbackError) {
        // Log for manual cleanup
        console.error("CRITICAL: Orphaned Shopify product", shopifyProductId);
      }
    }
    return { status: 500, error: error.message || "Failed to create product" };
  }
}

export async function getInstagramPendingStatus() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, hasPending: false };
    }

    await dbConnect();

    const pendingPost = await InstagramPostLog.findOne({
      userId: session.user.id,
      status: { $in: ["pending", "processing"] },
    }).select("status createdAt productIds");

    if (pendingPost) {
      return {
        status: 200,
        hasPending: true,
        pendingPost: {
          status: pendingPost.status,
          createdAt: pendingPost.createdAt.toISOString(),
          productCount: pendingPost.productIds?.length || 0,
        },
      };
    }

    return { status: 200, hasPending: false };
  } catch (error) {
    console.error("[getInstagramPendingStatus] Error:", error);
    return { status: 200, hasPending: false };
  }
}

export async function createBulkInstagramPosts(productIds) {
  try {
    const session = await auth();

    if (!session) {
      return { status: 401, error: "User is not authenticated" };
    }

    await dbConnect();

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { status: 400, error: "Product limit exceeded" };
    }

    if(productIds.length > 5){
      return {status:422,error:"not more than 5 products can be selected"}
    }

    // Block if there's already a post being processed
    const pendingPost = await InstagramPostLog.findOne({
      userId: session.user.id,
      status: { $in: ["pending", "processing"] },
    });

    if (pendingPost) {
      return {
        status: 429,
        error: "A previous Instagram post is still being processed. Please wait a few minutes and try again.",
      };
    }

    // Fetch user data for store name and city
    const user = await User.findById(session.user.id);
    if (!user) {
      return { status: 404, error: "User not found" };
    }

    // Fetch eligible products
    const products = await Product.find({
      _id: { $in: productIds },
      userId: session.user.id,
      hasInstagramPost: { $ne: true },
    });

    if (products.length === 0) {
      return {
        status: 400,
        error:
          "No eligible products found. They may already have Instagram posts or don't belong to you.",
      };
    }

    /**
     * Build images array (first image of each product)
     */
    const images = products
      .map((product) => {
        const originalUrl = product.images?.[0]?.url || product.images?.[0];
        if (!originalUrl) return null;

        // Best for quality + consistency (recommended)
        return convertToInstagramCompatibleImage(originalUrl, {
          quality: 90,
          crop: "fill",
          gravity: "auto",
        });

        // Or for no cropping (with white borders)
        // return convertToInstagramCompatibleImage(originalUrl, {
        //   quality: 90,
        //   crop: 'pad',
        //   background: 'white'
        // });
      })
      .filter(Boolean);

    if (images.length === 0) {
      return {
        status: 400,
        error: "No valid images found for selected products",
      };
    }

    /**
     * Build combined caption with store details
     */
    const storeName = user.storename || user.firstname || "Store";
    const storeCity = user.city || "";

    const caption = `
      ${products
        .map(
          (product, index) => `
      ${index + 1}. ${product.title}
      📍 Store: ${storeName}${storeCity ? ` | ${storeCity}` : ""}
      👚 Size: ${Array.isArray(product.size) ? product.size.join(", ") : product.size || "N/A"}
      💰 Price: ${product.price > 0 ? `€${product.price}` : "Contact for price"}
      🏷️ Category: ${product.subcategory || "Fashion"}
      `,
    )
  .join("\n")}

#lestores #preloved #sustainablefashion #secondhand
    `.trim();

    /**
     * Create ONE Instagram post log
     */
    const log = await InstagramPostLog.create({
      productIds: products.map((p) => p._id),
      userId: session.user.id,
      postType: images.length > 1 ? "carousel" : "single",
      status: "pending",
    });

    /**
     * Queue Instagram post via API (background)
     */
    const apiUrl =
      process.env.NODE_ENV === "development"
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/instagram/post`
        : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/api/instagram/post`;

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: products.map((p) => ({ _id: p._id })),
        images,
        caption,
        logId: log._id.toString(),
      }),
    }).catch(async (err) => {
      console.error(`[Instagram] Failed to queue grouped post:`, err.message);
      await Product.updateMany(
        { _id: { $in: products.map((p) => p._id) } },
        { hasInstagramPost: false },
      );
    });

    /**
     * Mark all products as posted
     */
    await Product.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { hasInstagramPost: true },
    );
    return {
      status: 200,
      message: `Successfully queued 1 Instagram post for ${products.length} products`,
      data: {
        productsQueued: products.length,
        logId: log._id.toString(),
      },
    };
  } catch (error) {
    console.error("[createBulkInstagramPosts] Error:", error);
    return {
      status: 500,
      error: error.message || "Failed to create Instagram posts",
    };
  }
}

/**
 * Convert image to Instagram-compatible format with high quality
 */
function convertToInstagramCompatibleImage(imageUrl, options = {}) {
  const {
    quality = 90, // 90% quality (range: 1-100)
    width = 1080, // Instagram recommended width
    aspectRatio = "1:1", // Square by default
    crop = "fill", // fill, pad, fit, limit
    gravity = "auto", // auto, face, center
    background = "white", // background color for padding
  } = options;

  if (imageUrl.includes("cloudinary.com")) {
    let transformation = `f_jpg,q_${quality},c_${crop}`;

    // Add aspect ratio for fill/pad modes
    if (crop === "fill" || crop === "pad") {
      transformation += `,ar_${aspectRatio}`;
    }

    // Add background for pad mode
    if (crop === "pad") {
      transformation += `,b_${background}`;
    }

    // Add gravity for fill mode
    if (crop === "fill") {
      transformation += `,g_${gravity}`;
    }

    // Add dimensions
    transformation += `,w_${width}`;

    return imageUrl.replace("/upload/", `/upload/${transformation}/`);
  }

  console.warn(`Non-Cloudinary image detected: ${imageUrl}`);
  return imageUrl;
}

/**
 * Check Instagram post status for products
 */
export async function getInstagramPostStatus(productIds) {
  try {
    const session = await auth();

    if (!session) {
      return { status: 401, error: "User is not authenticated" };
    }

    await dbConnect();

    const logs = await InstagramPostLog.find({
      productIds: { $in: productIds },
      userId: session.user.id,
    }).select("productId status instagramPostId postedAt errorLog");

    return {
      status: 200,
      data: logs,
    };
  } catch (error) {
    console.error("[getInstagramPostStatus] Error:", error);
    return {
      status: 500,
      error: error.message || "Failed to get post status",
    };
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
        "brandname",
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
      demoLimitReached = demoProductCount >= demoAccount.demoProductLimit;

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

    return {
      status: 200,
      count: productCount,
      isDemo: false,
      demoLimitReached,
    };
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
      "firstname lastname email address phoneNumber city",
    );

    if (session.user.role === "brand") {
      const userBrand = await User.findById(session.user.id).select(
        "brandname",
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
  { deleteDb = true, deleteWix = true, deleteShopify = true } = {},
) {
  const { _id } = product; // Only destructure _id from parameter
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();

    // Check if the product exists before attempting to delete
    const dbProduct = await Product.findById(_id); // Renamed to avoid shadowing
    if (!dbProduct) {
      throw new Error("Product not found.");
    }

    if (dbProduct.userId.toString() !== session.user.id) {
      throw new Error("You do not have permission to delete this product.");
    }

    if (deleteDb) {
      // Delete the product by ID
      await Product.deleteOne({ _id });
    }

    // if (deleteWix && dbProduct?.wixProductId) {
    //   try {
    //     await deleteWixProduct({ wixProductId: dbProduct.wixProductId });
    //     await Product.updateOne({ _id }, { $unset: { wixProductId: "" } });
    //   } catch (error) {
    //     console.log(error, "error");
    //   }
    // }

    if (deleteShopify && dbProduct?.shopifyProductId) {
      try {
        await deleteShopifyProduct([dbProduct]);
        await Product.updateOne({ _id }, { $unset: { shopifyProductId: "" } });
      } catch (error) {
        console.log(error, "error");
      }
    }

    return {
      status: 200,
      message: deleteShopify
        ? "Product deleted and unlinked from Shopify"
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
          // await unlinkWixProduct(product?.wixProductId);
          await Product.updateOne(
            { _id: productId },
            { $unset: { wixProductId: "" } },
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
    //update product in Shopify if shopifyProductId exists
    if (product?.shopifyProductId) {
      try {
        await updateShopifyProduct(product.shopifyProductId, data);
      } catch (error) {
        console.log(error, "error updating Shopify product");
      }
    }

    // Update product in Wix if it has a wixProductId
    // if (product?.wixProductId) {
    //   try {
    //     await updateWixProduct({ product, data });
    //   } catch (error) {
    //     console.log(error, "error updating Wix product");
    //     return {
    //       status: 500,
    //       error: "Product updated in DB but failed to update in Wix.",
    //     };
    //   }
    // }

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
      { $set: { sold: true } },
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
        (item) => item.productId.toString() === productId,
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
      (item) => item.productId.toString() === productId,
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
        { $set: { archived: false } },
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
      // const result = await archiveWixProduct(product?.wixProductId);

      // Update in MongoDB
      if (result.status === 200) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id },
          { archived: true },
          { new: true },
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
      // await unarchiveWixProduct(product?.wixProductId);

      //  Update in MongoDB
      await Product.findOneAndUpdate(
        { _id: product._id },
        { archived: false },
        { new: true },
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
        "brandname",
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
              brand: (await User.findById(session.user.id).select("brandname"))
                .brandname,
              collect: true,
            }),
          },
        },
        "storename",
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
