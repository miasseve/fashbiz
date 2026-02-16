import { signInUser } from "@/actions/authActions";
import ActiveUser from "@/models/Activeuser";
import User from "@/models/User";
import { getSubscriptionPlans } from "@/actions/stripePlans";
import crypto from "crypto";

const DEVICE_COOKIE_NAME = "ree-device-id";
const DEVICE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function buildCookieHeader(deviceId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${DEVICE_COOKIE_NAME}=${deviceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DEVICE_COOKIE_MAX_AGE}${secure}`;
}

export async function POST(req) {
  try {
    // Read or generate device ID from cookie
    const existingDeviceId = req.cookies.get(DEVICE_COOKIE_NAME)?.value;
    const deviceId = existingDeviceId || crypto.randomUUID();

    const payload = await req.json();
    const result = await signInUser(payload);

    if (result.status === 200) {
      const user = await User.findOne({ email: payload.email });
      const subscriptionType = user?.subscriptionType;
      const userRole = user?.role;

      if (subscriptionType !== "free" && userRole === "store") {
        const data = await getSubscriptionPlans();

        const matchedPlan = data.find(
          (plan) => plan.product.name === subscriptionType
        );

        const maxUsers = matchedPlan ? matchedPlan.maxUsers : null;
        const existingSession = await ActiveUser.findOne({
          userId: user._id,
          deviceId,
        });

        if (!existingSession) {
          // New device → check active user count before allowing
          const activeUserCount = await ActiveUser.countDocuments({
            userId: user._id,
          });

          if (maxUsers && activeUserCount >= maxUsers) {
            const rejectResponse = new Response(
              JSON.stringify({
                status: 403,
                error: `Access denied: Maximum active user limit (${maxUsers}) reached for your plan.`,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
            rejectResponse.headers.append("Set-Cookie", buildCookieHeader(deviceId));
            return rejectResponse;
          }

          // If allowed, add the new device as active session
          await ActiveUser.create({
            userId: user._id,
            deviceId,
            lastActiveAt: new Date(),
          });
        } else {
          existingSession.lastActiveAt = new Date();
          await existingSession.save();
        }
      }
    }

    const response = new Response(JSON.stringify(result), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
    response.headers.append("Set-Cookie", buildCookieHeader(deviceId));
    return response;
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ status: 500, error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
