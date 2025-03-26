import { connectToMongoDB } from "@/lib/db";
import Account from "@/models/account";
import type { NextAuthOptions } from "next-auth";
import credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts";
export const authOptions: NextAuthOptions = {
  providers: [
    credentials({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        connectToMongoDB();
        const user = await Account.findOne({
          email: credentials?.email,
        }).select("+password");

        if (!user) throw new Error("Wrong Email");
        const passwordMatch = await compare(
          credentials!.password.toString(),
          user.password,
        );
        
        if (!passwordMatch) throw new Error("Wrong Password");
        return user.toJSON();
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
};
