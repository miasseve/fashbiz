import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

const REPLACEMENT_CHAR = "�";
const DELAY_MS = 700; // stay well within cvrapi.dk's fair-use limit

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One-time repair for store names corrupted during an old import (bytes lost
// to the Unicode replacement character — irreversible from the corrupted
// text alone). Each store's CVR number was never touched, so the real name
// can be recovered by looking it up against Denmark's public business
// registry instead of guessing.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  await dbConnect();

  const corrupted = await User.find({
    role: "store",
    storename: { $regex: REPLACEMENT_CHAR },
  }).select("_id storename businessNumber");

  const fixed = [];
  const skipped = [];

  for (const store of corrupted) {
    if (!store.businessNumber) {
      skipped.push({ id: String(store._id), oldName: store.storename, reason: "no CVR number on file" });
      continue;
    }

    try {
      const res = await fetch(
        `https://cvrapi.dk/api?search=${encodeURIComponent(store.businessNumber)}&country=dk`,
        { headers: { "User-Agent": "ree-store-repair/1.0 (contact: gurri.singh8686@gmail.com)" } },
      );
      const data = await res.json();

      if (!res.ok || !data?.name || data.name.includes(REPLACEMENT_CHAR)) {
        skipped.push({
          id: String(store._id),
          oldName: store.storename,
          reason: data?.message || "registry lookup returned no usable name",
        });
      } else {
        await User.updateOne({ _id: store._id }, { $set: { storename: data.name } });
        fixed.push({ id: String(store._id), oldName: store.storename, newName: data.name });
      }
    } catch (error) {
      skipped.push({ id: String(store._id), oldName: store.storename, reason: error.message });
    }

    await sleep(DELAY_MS);
  }

  return Response.json({
    ok: true,
    totalCorrupted: corrupted.length,
    fixed: fixed.length,
    skipped: skipped.length,
    fixedDetails: fixed,
    skippedDetails: skipped,
  });
}
