"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import axios from "axios";
import Cart from "@/models/Cart";

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
    } = formData;
    
    await dbConnect();
    const formattedPrice = Number(parseFloat(price).toFixed(2));
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
        productOptions: [
          {
            name: "Color",
            choices: [
              {
                value: color.name || "N/A",
                description: color.name || color.hex || "N/A",
              },
            ],
          },
        ],
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

      const productId = response.data.product.id;
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
            productIds: [productId], // Add product to the collection
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

      // Save product in MongoDB
      const newProduct = new Product({
        sku,
        title,
        brand,
        subcategory,
        category: collectionId,
        description,
        color,
        price: formattedPrice,
        images,
        userId: session.user.id,
        consignorName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        consignorEmail: email ?? "",
        consignorAccount: accountId ?? "",
        wixProductId: productId,
      });

      await newProduct.save();

      const user = await User.findById(session.user.id);
      if (user) {
        user.products.push(newProduct._id);
        await user.save();
      }

      const link = process.env.NODE_ENV === "development"
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/product/${newProduct._id}`
        : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/product/${newProduct._id}`;

      return {
        status: 200,
        message: "Product created successfully and added to collection",
        data: link,
      };
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
    const userProducts = await Product.find({
      userId: session.user.id,
      sold: false,
    }).sort({
      createdAt: -1,
    });

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
    const productCount = await Product.countDocuments({
      userId: session.user.id,
    });

    return { status: 200, count: productCount };
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

    if (product.userId.toString() !== session.user.id.toString()) {
      throw new Error("You are not authorized to view this product");
    }

    const user = await User.findOne(
      { email: product.consignorEmail },
      "firstname lastname email address phoneNumber city"
    );

    // if (!user) {
    //   throw new Error("User related to the product not found");
    // }
    return {
      status: 200, // Success status code
      message: "Product fetched successfully",
      data: {
        product: JSON.stringify(product),
        user: JSON.stringify(user),
      },
    }; // Return the product details
  } catch (error) {
    return {
      status: 500, // Internal server error status code
      error: error.message || "Failed to fetch product",
    };
  }
}

export async function deleteProductByIdAndWix(product) {
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
    // Delete the product by ID
    await Product.deleteOne({ _id });

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
    } catch (error) {
      console.log(error, "error");
    }

    return { status: 200, message: "Product deleted successfully." };
  } catch (error) {
    return { status: 500, error: error.message || "Something went wrong" };
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

    if (product.userId.toString() !== session.user.id) {
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
    await Product.updateOne({ _id: productId }, { $set: data });

    if (product.wixProductId) {
      try {
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
        console.log(error, 'error')
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
    return { error: error.message || "Failed to add product to cart", status: 500 };
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
      status: 200
    };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return {
      error: error.message || "Failed to remove item",
      status: 200
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
      status: 200
    };
  } catch (error) {
    console.error("Error clearing cart after checkout:", error);
    return {
      error: error.message || "Failed to clear cart",
      status: 200
    };
  }
}