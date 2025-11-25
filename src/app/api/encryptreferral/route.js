// C:\Users\Admin\Desktop\React\NextJS\live\fashion-app\src\app\api\encryptreferral\route.js
import { encrypt } from "@/actions/encryption";
import { decrypt } from "@/actions/encryption";
import StoreReferralCode from "@/models/StoreReferralCode";
import { auth } from "@/auth";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = await req.json();
    const { code } = body;

    // Validate input
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Encrypt the referral code
    const encrypted = encrypt(code.trim());

    return new Response(JSON.stringify({ encrypted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Encryption error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to encrypt referral code" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const { searchParams } = new URL(req.url);

    // Match the URL query parameter
    const encryptedCode = searchParams.get("referral");
    if (!encryptedCode) {
      return new Response(JSON.stringify({ error: "Missing referral code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decrypted = decrypt(encryptedCode);
    const referraldata = await StoreReferralCode.findOne({
      referralCode: decrypted,
    });

    return new Response(
      JSON.stringify({ code: decrypted, userId: referraldata?.user_id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Decryption error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to decrypt referral code" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
