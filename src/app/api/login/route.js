import { signInUser } from "@/actions/authActions";
import ActiveUser from "@/models/Activeuser";
import User from "@/models/User";
import { getInternetIp } from "@/actions/getClientIp";

export async function POST(req) {
  try {
    const payload = await req.json();

    const result = await signInUser(payload);

    if (result.status === 200) {
      const user = await User.findOne({ email: payload.email });
      const subscriptionType = user?.subscriptionType;
      if (subscriptionType != "free") {
        const base =
          process.env.NODE_ENV === "production"
            ? process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL
            : process.env.NEXT_PUBLIC_FRONTEND_URL;

        const res = await fetch(`${base}/api/stripe/plans`);
        const data = await res.json();

        const matchedPlan = data.find(
          (plan) => plan.product.name === subscriptionType
        );

        const maxUsers = matchedPlan ? matchedPlan.maxUsers : null;
        const ipAddress = await getInternetIp();
        const existingSession = await ActiveUser.findOne({
          userId: user._id,
          ipAddress,
        });
        if (!existingSession) {
          // If new IP → check active user count before allowing
          const activeUserCount = await ActiveUser.countDocuments({
            userId: user._id,
          });

          if (maxUsers && activeUserCount >= maxUsers) {
            return new Response(
              JSON.stringify({
                status: 403,
                error: `Access denied: Maximum active user limit (${maxUsers}) reached for your plan.`,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          //  If allowed, add the new IP as active session
          await ActiveUser.create({
            userId: user._id,
            ipAddress,
            lastActiveAt: new Date(),
          });
        } else {
          existingSession.lastActiveAt = new Date();
          await existingSession.save();
        }
      }
    }

    return new Response(JSON.stringify(result), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ status: 500, error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
