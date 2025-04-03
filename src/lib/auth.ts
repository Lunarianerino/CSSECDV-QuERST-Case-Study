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
        }).select("+password +type +onboarced");
        if (!user) throw new Error("Wrong Email");
        const passwordMatch = await compare(
          credentials!.password.toString(),
          user.password
        );
        console.log(user);
        if (!passwordMatch) throw new Error("Wrong Password");
        return {
          id: user._id.toString(),
          email: user.email,
          type: user.type,
          name: user.name, 
          onboarded: user.onboarded, 
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        token.name = user.name;
        token.onboarded = user.onboarded;
      }
      
      // Check for updated user data on each token refresh
      if (token.email) {
        try {
          await connectToMongoDB();
          const latestUser = await Account.findOne({ email: token.email });
          
          if (latestUser) {
            // Update token with latest user data
            token.name = latestUser.name;
            token.type = latestUser.type;
            token.onboarded = latestUser.onboarded;
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT callback:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.type = token.type as string;
        session.user.name = token.name as string;
        session.user.onboarded = token.onboarded as boolean;
        // For debugging
        // console.log("Token in session callback:", token);
        // console.log("Session after modification:", session);
      }
      return session;
    },
  },
};
