import { NextResponse } from "next/server";
import { linkInquiry } from "@/mails/linkInquiry";

export async function POST(req) {
  try {
    const body = await req.json();
    const { storeName, contactEmail, webshopUrl, message } = body;

    if (!storeName || !storeName.trim()) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }
    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!webshopUrl || !webshopUrl.trim()) {
      return NextResponse.json({ error: "Webshop URL is required" }, { status: 400 });
    }

    await linkInquiry({
      storeName: storeName.trim(),
      contactEmail: contactEmail.trim(),
      webshopUrl: webshopUrl.trim(),
      message: (message || "").trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link inquiry error:", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
