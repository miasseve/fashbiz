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
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.storename=token.storename;
      }

      return session;
    },
  },
});
