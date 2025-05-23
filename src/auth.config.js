import Credentials from "next-auth/providers/credentials";
import dbConnect from "./lib/db";
import User from "./models/User";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Credentials({
      name: "credentials",
      async authorize(credentials) {
        try {
          await dbConnect();

          // Find user by email
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("User not found");
          }

          // Compare hashed password with provided password
          const isMatch = await bcrypt.compare(credentials.password, user.password);

          if (!isMatch) {
            throw new Error("Invalid credentials");
          }

          // Return user data if authentication succeeds
          return {
            id: user._id,
            storename: user.storename,
            email: user.email,
            role: user.role,
            name: user.firstname + " " + user.lastname
          };
        } catch (error) {
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session instead of a database session
  },
};
