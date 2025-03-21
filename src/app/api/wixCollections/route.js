import { NextResponse } from "next/server";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { collections } from "@wix/stores";

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID; // Store in .env

// Create Wix SDK Client
const wixClient = createClient({
  modules: { collections },
  auth: OAuthStrategy({ clientId: WIX_CLIENT_ID }),
});

// Fetch Wix Collections
export async function GET() {
  try {
    const collectionList = await wixClient.collections
      .queryCollections()
      .find();
    
    if (collectionList && collectionList.items.length === 0) {
      return NextResponse.json(
        {
          total: 0,
          collections: [],
        },
        { status: 200 }
      );
    }
    const filteredCollections = collectionList.items.filter(
        (item) => item._id !== '00000000-000000-000000-000000000001'
    );

    return NextResponse.json(
      {
        total: filteredCollections.length,
        collections: filteredCollections.map((item) => ({
          id: item._id,
          name: item.name,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
