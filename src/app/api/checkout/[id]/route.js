import { NextResponse } from "next/server";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { cart } from "@wix/ecom";
import Product from "@/models/Product";
// import Cors from 'cors';

// // Initialize CORS middleware with the appropriate configuration
// const cors = Cors({
//   origin: 'https://www.le-stores.com', // Your Wix site domain
//   methods: ['GET', 'POST'], // Allow these HTTP methods
//   allowedHeaders: ['Content-Type'], // Allow Content-Type header for JSON requests
// });

// function runMiddleware(req, res, fn) {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result) => {
//       if (result instanceof Error) {
//         return reject(result);
//       }
//       return resolve(result);
//     });
//   });
// }

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID; // Store in .env

const myWixClient = createClient({
  modules: { cart },
  auth: OAuthStrategy({ clientId: WIX_CLIENT_ID }),
  // Include the auth strategy and host as relevant
});
async function getCart(id) {
  try {
    
    //   const responseCart = await cart.getCart(id);
    const response = await myWixClient.cart.getCart(id);
    //   console.log("Is it a function?", typeof responseCart);
    //   const res=await responseCart();
    console.log("Cart response:", response); // Log the response to see what is returned
    return response;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { error: "Failed to fetch cart" }; // Return an error if the fetch fails
  }
}

async function fetchProductByWixId(wixProductId) {
  const product = await Product.findOne({ wixProductId: wixProductId });
  // Replace with actual API call to get the product by its wixProductId
  return product;
}

export async function GET(req, { params }) {
  const { id } = params;
  const response = await getCart('f7181250-d8f1-4021-8f92-66f2ddefab36');

  let productIds = response.lineItems.map(
    (item) => item.catalogReference.catalogItemId
  );
  let products = [];
  for (let productId of productIds) {
    // Assuming you have a function to fetch products by wixProductId
    let product = await fetchProductByWixId(productId);

    // Push the product into the array if it exists
    if (product) {
      products.push(product);
    }
  }
  const subTotal = response.subtotal.formattedAmount;
  const total = response.subtotalAfterDiscounts.formattedAmount;
  const discount = response.discount.formattedAmount;

  return NextResponse.json(
    { products: products, subTotal, total, discount },
    { status: 200 }
  );

  // }
  //   try {
  //     // Parse the cart data sent in the request body
  //     const cart = await req.json();

  //     // Log the cart data for debugging
  //     console.log('Received cart data:', cart);

  //     // Example of a redirect URL or processing the cart
  //     const redirectUrl = 'https://localhost:3000/checkout'; // Change to actual URL after checkout

  //     // Send a JSON response with the redirect URL
  return NextResponse.json({ message: response });
  //   } catch (error) {
  //     console.error('Error processing the cart:', error);
  //     return NextResponse.json({ error: 'Failed to process the cart' }, { status: 500 });
  //   }
}
