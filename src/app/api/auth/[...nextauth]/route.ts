//TODO: Replace with a server action
import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };