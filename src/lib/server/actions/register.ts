"use server";
import { connectToMongoDB } from "@/lib/db";
import Account from "@/models/account";
import { hash } from "bcrypt-ts";

export const register = async (values: any) => {
  const { email, password, name, type } = values;

  try {
      await connectToMongoDB();
      const userFound = await Account.findOne({ email });
      if(userFound){
        throw new Error("User already exists");
      }
      const hashedPassword = await hash(password, 10);
      const user = new Account({
        name,
        email,
        password: hashedPassword,
        type
      });
      const savedUser = await user.save();
      return savedUser.toObject();
  }catch(e){
      console.log(e);
      throw e;
  }
}