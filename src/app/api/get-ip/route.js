
export async function GET(req) {
  try {
    //Read IP from x-forwarded-for
    const forwarded = req.headers.get("x-forwarded-for");
    const rawIP = forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "::1";

    //Normalize it to IPv4
    const ip = normalizeIP(rawIP);

    return Response.json({ ip });
  } catch (error) {
    console.error("Error fetching IP:", error);
    return Response.json({ error: "Unable to get IP" }, { status: 500 });
  }
}

function normalizeIP(ip) {
  if (!ip) return "";

  if (ip === "::1") return "127.0.0.1";

  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }

  return ip;
}
