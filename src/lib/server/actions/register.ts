"use server";
import { connectToMongoDB } from "@/lib/db";
import { Account } from "@/models";
import { hash, compare } from "bcrypt-ts";

export const register = async (values: any) => {
  const { email, password, name } = values;

  try {
      await connectToMongoDB();
      const userFound = await Account.findOne({ email });
      if(userFound){
        throw new Error("User already exists");
      }
      const user = new Account({
        name,
        email,
        password,
      });
      const savedUser = await user.save();
      return {
        success: true,
        message: "User created successfully",
      };
  }catch(e){
      console.log(e);
      throw e;
  }
}