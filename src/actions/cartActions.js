"use server";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { cart } from "@wix/ecom";

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID; // Store in .env

const myWixClient = createClient({
modules: { cart },
auth: OAuthStrategy({ clientId: WIX_CLIENT_ID }),
// Include the auth strategy and host as relevant
});

export async function getCartData(id) {
  try {
  
    console.log("WIX_CLIENT_IDDDDDDD:", WIX_CLIENT_ID); 
    console.log(myWixClient,'myWixClient')
    const response = await myWixClient.cart.getCart(id);
    return response;
    
  } catch (error) {
    console.log(error.message,'error')
    return { error: "Failed to fetch cart" }; 
  }
}


