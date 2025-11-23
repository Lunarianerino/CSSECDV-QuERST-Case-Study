import { connectToMongoDB } from "@/lib/db";
import { Account } from "@/models";
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
        const email = credentials?.email;
        const password = credentials?.password;

        // --- VALIDATION START ---

        // 1. Check for existence
        if (!email || !password) {
          throw new Error("Please enter both email and password.");
        }

        // 2. Validate Data Length (Email)
        // Standard email max length is usually 254, but you can set a lower logic cap.
        if (email.length < 5 || email.length > 254) {
          throw new Error("Invalid email length.");
        }

        // 3. Validate Data Range / Password Cap
        // Min: 8 (Standard security)
        // Max: 64 (Prevents DoS attacks on hashing algorithms and meets your "cap" requirement)
        const MIN_PASS_LENGTH = 8;
        const MAX_PASS_LENGTH = 64;

        if (password.length < MIN_PASS_LENGTH || password.length > MAX_PASS_LENGTH) {
          throw new Error(
            `Password must be between ${MIN_PASS_LENGTH} and ${MAX_PASS_LENGTH} characters.`
          );
        }

        // --- VALIDATION END ---

        connectToMongoDB();
        
        const user = await Account.findOne({
          email: email,
        });

        if (!user) throw new Error("Invalid Credentials");
        if (user.disabled) throw new Error("Account disabled");

        const prevAttempt = {
          at: user.lastLoginAttemptAt,
          success: user.lastLoginAttemptSuccess,
        };

        const passwordMatch = await compare(
          password.toString(),
          user.password
        );

        // console.log(user);
        if (!passwordMatch) {
          await Account.updateOne({ _id: user._id }, {
            lastLoginAttemptAt: new Date(),
            lastLoginAttemptSuccess: false,
          });
          throw new Error("Invalid Credentials");
        }

        await Account.updateOne({ _id: user._id }, {
          lastLoginAttemptAt: new Date(),
          lastLoginAttemptSuccess: true,
        });

        return {
          id: user._id.toString(),
          email: user.email,
          type: user.type,
          name: user.name,
          onboarded: user.onboarded,
          prevLoginAttempt: prevAttempt
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
        if (user && (user as any).prevLoginAttempt) {
          token.prevLoginAttempt = (user as any).prevLoginAttempt;
        }
      }

      // Check for updated user data on each token refresh
      if (token.email) {
        try {
          await connectToMongoDB();
          const latestUser = await Account.findOne({ email: token.email });

          if (latestUser) {
            // Update token with latest user data
            token.id = latestUser._id.toString();
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
        session.user.prevLoginAttempt = token.prevLoginAttempt as JSON;
        // For debugging
        // console.log("Token in session callback:", token);
        // console.log("Session after modification:", session);
      }
      return session;
    },
  },
};
