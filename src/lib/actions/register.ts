"use server";
import { connectToMongoDB } from "@/lib/db";
import { Account } from "@/models";
import { hash, compare } from "bcrypt-ts";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

export const register = async (values: any) => {
  const { email, password, name } = values;

  try {
      await connectToMongoDB();
      const userFound = await Account.findOne({ email });
      if(userFound){
        await logSecurityEvent({
          event: SecurityEvent.OPERATION_CREATE,
          outcome: "failure",
          resource: "register",
          message: `Account already exists for ${email}`,
        });
        return {
          success: false,
          message: "Account already exists"
        }
      }
      const user = new Account({
        name,
        email,
        password,
      });
      const savedUser = await user.save();
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_CREATE,
        outcome: "success",
        userId: savedUser._id.toString(),
        resource: "register",
        message: `User registered: ${email}`,
      });
      return {
        success: true,
        message: "User created successfully",
      };
  }catch(e){
      // console.log(e);
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_CREATE,
        outcome: "failure",
        resource: "register",
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
  }
}
