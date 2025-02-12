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
      throw new Error("User is not authenticated");
    }

    const { title, sku, description, price, images } = formData;
    const firstName = "test";
    const email = "testing@gmail.com";
    await dbConnect();

    // Construct product data for Wix API
    const productData = {
      product: {
        name: title,
        productType: "physical",
        priceData: {
          price: price,
        },
        description: description,
        sku: sku,
        visible: false,
      },
    };
    try {
      // Make the POST request to Wix API to create the product
      const response = await axios.post(
        "https://www.wixapis.com/stores/v1/products",
        productData,
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
            "wix-account-id": process.env.WIX_ACCOUNT_ID,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );

      const productImages = {
        media: images.map((image) => ({ url: image.url })),
      };
      const res = await axios.post(
        `https://www.wixapis.com/stores/v1/products/${response.data.product.id}/media`,
        productImages,
        {
          headers: {
            Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
            "wix-account-id": process.env.WIX_ACCOUNT_ID,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
        }
      );

      // Create a new product in your local MongoDB
      const newProduct = new Product({
        sku,
        title,
        category: "dsfsdds",
        description,
        price,
        images,
        userId: session.user.id,
        consignorName: firstName,
        consignorEmail: email,
      });

      // Save the product to MongoDB
      await newProduct.save();

      // Add the product ID to the user's products array
      const user = await User.findById(session.user.id);
      if (user) {
        user.products.push(newProduct._id);
        await user.save();
      }
      return {
        status: 200,
        message: "Product created successfully",
        data: JSON.stringify(newProduct),
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
            message: "SKU already exist",
          };
        } else {
          return {
            status: 400,
            message: data?.message,
          };
        }
      } else {
        return {
          status: 400,
          message: data?.message,
        };
      }
    }
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product. Please try again later.");
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
    const userProducts = await Product.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return JSON.stringify(userProducts); // Return the user's products
  } catch (error) {
    console.error("Error fetching user products:", error);
    throw new Error("Unable to fetch products. Please try again later.");
  }
}

export async function deleteProduct (productId) {
  try {
    const response = await axios.delete(
      `https://www.wixapis.com/stores/v1/products/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WIX_API_KEY}`, // Using the Wix API key from env
          "wix-account-id": process.env.WIX_ACCOUNT_ID,
          "wix-site-id": process.env.WIX_SITE_ID,
          "Content-Type": "application/json",
        },
      }
    );
    console.log('Product deleted successfully:', response.data);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

export async function getUserProductCount() {
  try {
    // Authenticate and get the session
    const session = await auth();

    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();

    // Count the number of products for the authenticated user
    const productCount = await Product.countDocuments({
      userId: session.user.id,
    });

    return productCount; // Return the product count
  } catch (error) {
    console.error("Error fetching product count:", error);
    throw new Error("Unable to fetch product count. Please try again later.");
  }
}
export async function getProductById(productId) {
  try {
    // Authenticate and get the session
    // const session = await auth();

    // if (!session) {
    //   throw new Error("User is not authenticated");
    // }

    // Connect to the database
    await dbConnect();

    // Fetch the product by ID for the authenticated user
    const product = await Product.findOne({
      _id: productId,
    });

    if (!product) {
      throw new Error(
        "Product not found or you don't have permission to view it"
      );
    }

    return JSON.stringify(product); // Return the product details
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw new Error("Unable to fetch the product. Please try again later.");
  }
}
