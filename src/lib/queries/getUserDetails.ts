import { Account } from "@/models";
import { connectToMongoDB } from "../db";

export interface UserDetails {
  name: string;
  type: string;
  onboarded: boolean;
}

const getUserDetails = async (email: string): Promise<UserDetails> => {
  await connectToMongoDB();
  const user = await Account.findOne({
    email: email,
  }).select("+type +onboarded +name");
  if (!user) throw new Error("Email not found");
  return {
    name: user.name,
    type: user.type,
    onboarded: user.onboarded,
  };
}
export default getUserDetails;