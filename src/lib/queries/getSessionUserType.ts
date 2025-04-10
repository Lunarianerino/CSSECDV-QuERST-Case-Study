"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

export const getSessionUserType = async (): Promise<AccountType> => {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.type as AccountType;
  } catch (error) {
    console.error("Error getting session user type:", error);
    return AccountType.UNKNOWN; 
  }
}