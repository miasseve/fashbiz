import Credentials from "next-auth/providers/credentials";
import dbConnect from "./lib/db";
import User from "./models/User";

export default {
  providers: [
    Credentials({
      name: "credentials",
      async authorize(creds) {
        await dbConnect();

        // Example: Find user by email
        const user = await User.findOne({ email: creds.email });

        if (user) {
          return { id: user._id, storename: user.storename, email: user.email };
        }
        return null;
      },
    }),
  ],
};
