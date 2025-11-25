export async function getInternetIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.error("Error:", err);
    return "0.0.0.0"
  }
}

// import { v4 as uuidv4 } from "uuid";
// export function getDeviceId() {
//   let deviceId = localStorage.getItem("device_id");
//   if (!deviceId) {
//     deviceId = uuidv4();
//     localStorage.setItem("device_id", deviceId);
//   }
//   return deviceId;
// }

// // actions/getClientIp.js
// export function getClientIp(req) {
//   return (
//     req.headers["x-forwarded-for"]?.split(",")[0] ||
//     req.connection?.remoteAddress ||
//     req.socket?.remoteAddress ||
//     null
//   );
// }

