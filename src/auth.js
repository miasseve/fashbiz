// changes in this file
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";

// Same check the Profile page's webstore tab uses — a subscriptionType
// heuristic alone misses stores whose webstore access comes from a paid
// add-on purchase instead of their subscription plan (e.g. Mia's own
// account), which showed as "not active" elsewhere even though it's real.
export async function computeHasWebstoreAccess(userId, subscriptionType) {
  const subType = subscriptionType?.toLowerCase() || "";
  if (
    subType.includes("webstore") ||
    subType.includes("plugin") ||
    subType.includes("plug") ||
    subType === "pro" ||
    subType === "business"
  ) {
    return true;
  }
  try {
    await dbConnect();
    const purchase = await AddOnPurchase.findOne({
      userId,
      status: "paid",
      addOns: { $in: ["webstore", "plugin"] },
    }).lean();
    return !!purchase;
  } catch (error) {
    console.error("Error checking webstore add-on:", error);
    return false;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.storename = user.storename;
        token.role = user.role;
        token.name=user.name;
        token.isActive=user.isActive;
        token.points_mode=user.points_mode;
        token.subscriptionType=user.subscriptionType;
        token.hasWebstoreAccess = await computeHasWebstoreAccess(user.id, user.subscriptionType);
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.storename=token.storename;
        session.user.role=token.role;
        session.user.name=token.name;
        session.user.isActive=token.isActive;
        session.user.points_mode=token.points_mode;
        session.user.subscriptionType=token.subscriptionType;
        session.user.hasWebstoreAccess=token.hasWebstoreAccess;
      }

      return session;
    },
  },
});
