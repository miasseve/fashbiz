import { headers } from "next/headers";

function normalizeIP(ip) {
  if (!ip) return "";
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip.trim();
}

// Extract client IP from the incoming request headers (works in server actions & API routes)
export async function getClientIpFromHeaders() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const rawIP =
      forwarded?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "0.0.0.0";
    return normalizeIP(rawIP);
  } catch (err) {
    console.error("Error getting client IP from headers:", err);
    return "0.0.0.0";
  }
}

// Extract client IP directly from a request object (for use in API route handlers)
export function getClientIpFromRequest(req) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const rawIP =
      forwarded?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";
    return normalizeIP(rawIP);
  } catch (err) {
    console.error("Error getting client IP from request:", err);
    return "0.0.0.0";
  }
}
