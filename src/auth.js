// changes in this file
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      }

      return session;
    },
  },
});
