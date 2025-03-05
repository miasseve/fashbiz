"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import axios from "axios";

export async function createProduct(formData) {
  try {
    // Connect to the database
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
    } = formData;
    await dbConnect();

    // Construct product data for Wix API
    // const productData = {
    //   product: {
    //     name: title,
    //     productType: "physical",
    //     priceData: {
    //       price: price,
    //     },
    //     description: description,
    //     sku: sku,
    //     visible: false,
    //   },
    // };
    try {
      // Make the POST request to Wix API to create the product
      // const response = await axios.post(
      //   "https://www.wixapis.com/stores/v1/products",
      //   productData,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
      //       "wix-account-id": process.env.WIX_ACCOUNT_ID,
      //       "wix-site-id": process.env.WIX_SITE_ID,
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      // const productImages = {
      //   media: images.map((image) => ({ url: image.url })),
      // };
      // const res = await axios.post(
      //   `https://www.wixapis.com/stores/v1/products/${response.data.product.id}/media`,
      //   productImages,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
      //       "wix-account-id": process.env.WIX_ACCOUNT_ID,
      //       "wix-site-id": process.env.WIX_SITE_ID,
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      // Create a new product in your local MongoDB
      const newProduct = new Product({
        sku,
        title,
        brand:brand,
        category: "test",
        description,
        price,
        images,
        userId: session.user.id,
        consignorName: firstName + lastName,
        consignorEmail: email,
        consignorAccount: accountId,
        // wixProductId: response.data.product.id,
      });

      // Save the product to MongoDB
      await newProduct.save();
      // Add the product ID to the user's products array
      const user = await User.findById(session.user.id);
      if (user) {
        user.products.push(newProduct._id);
        await user.save();
      }
      const link = `https://fash-roan.vercel.app/product/${newProduct._id}`;

      return {
        status: 200,
        message: "Product created successfully",
        data: link,
      };
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (
          status === 400 &&
          data?.message == "requirement failed: product.sku is not unique"
        ) {
          return {
            status: 400,
            error: "SKU already exist",
          };
        } else {
          return {
            status: 400,
            error: data?.message,
          };
        }
      } else {
        return {
          status: 400,
          error: data?.message,
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

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new Error("User not found");
    }

    await dbConnect();
    const groupedProducts = await Product.aggregate([
      {
        $match: {
          consignorEmail: email,
          sold: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            {
              $project: {
                firstname: 1,
                lastname: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $group: {
          _id: "$userId",
          products: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { "products.createdAt": -1 },
      },
    ]);
    return {
      status: 200,
      products: JSON.stringify(groupedProducts),
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

    // Fetch products for the authenticated user
    const userProducts = await Product.find({
      userId: session.user.id,
      sold: true,
    }).sort({
      createdAt: -1,
    });

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
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return;
    }

    // Loop through the products array and delete each product using its wixProductId
    for (const product of products) {
      const { wixProductId } = product; // Get the wixProductId for each product
      // Make a DELETE request to Wix API to delete the product
      const response = await axios.delete(
        `https://www.wixapis.com/stores/v1/products/${wixProductId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
            "wix-account-id": process.env.WIX_ACCOUNT_ID,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );

   
    }
  } catch (error) {
    console.error("Error deleting product:", error);
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

    const user = await User.findOne({ email: product.consignorEmail },
      'firstname lastname email address phoneNumber city'
    );
    if (!user) {
      throw new Error("User related to the product not found");
    }
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

export async function soldProductsByIds(products) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    await dbConnect();

    // Ensure the array is not empty
    if (!Array.isArray(products) || products.length === 0) {
      return {
        status: 400,
        message: "Products not exist",
      };
    }

    const productIds = products.map((product) => product._id);

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
