export async function getInternetIp() {
  try {
    const base =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL
        : process.env.NEXT_PUBLIC_FRONTEND_URL;
    const res = await fetch(base + "/api/get-ip");
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.error("Error:", err);
    return "0.0.0.0";
  }
}
