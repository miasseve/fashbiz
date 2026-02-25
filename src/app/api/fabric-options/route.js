// ============= app/api/fabrics/route.js =============
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FabricOption from "@/models/FabricOption";
import { auth } from "@/auth";

const FABRIC_OPTIONS = [
  "Cotton",
  "Wool",
  "Denim",
  "Tweed",
  "Leather",
  "Suede",
  "Silk",
  "Fur",
  "Viscose",
  "Acrylic",
  "Cashmere",
  "Alpaca",
  "Synthetique",
  "Synthetic Leather",
  "Lace",
  "Synthetic Fur",
  "Linen",
  "Merinos",
  "Mousseline",
  "Nylon",
  "Polyester",
  "Satin",
  "Velvet",
  "Corduroy",
  "Elastane",
];

// GET = Insert missing fabrics first, THEN return all
export async function GET() {
  // Auth is optional — allow guest/try mode to fetch fabric list
  let session;
  try {
    session = await auth();
  } catch (_) {
    // ignore auth errors for guest access
  }

  await dbConnect();

  try {
    // Insert missing fabrics
    for (const name of FABRIC_OPTIONS) {
      await FabricOption.updateOne(
        { name },
        { name, active: true },
        { upsert: true }
      );
    }

    // Now fetch all active fabrics
    const fabrics = await FabricOption.find({ active: true }).sort({ name: 1 });

    return NextResponse.json(fabrics, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
