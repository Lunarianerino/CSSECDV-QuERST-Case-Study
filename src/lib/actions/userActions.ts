"use server";
import { connectToMongoDB } from "../db";
import { Account } from "@/models";
import { AccountType } from "@/models/account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BasicAccountInfo } from "@/types/accounts";


/**
 * Alternative implementation using aggregation pipeline
 * This is more efficient for large datasets as it only requires one database query
 */
export async function getTutorsAndStudentsAggregation() {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Use aggregation to group users by type
    const result = await Account.aggregate([
      {
        $match: {
          type: { $in: [AccountType.TUTOR, AccountType.STUDENT] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          type: 1,
          onboarded: 1,
          createdAt: 1,
          updatedAt: 1
          // Exclude password field
        }
      },
      {
        $group: {
          _id: "$type",
          users: { $push: "$$ROOT" }
        }
      }
    ]);

    // Transform the result into the expected format
    const tutorsAndStudents = {
      tutors: [],
      students: []
    };

    result.forEach(group => {
      // Map MongoDB documents to User type with proper type conversion
      const mappedUsers = group.users.map((user: any) => ({
        _id: user._id.toString(), // Convert ObjectId to string
        name: user.name,
        email: user.email
      }));
      
      if (group._id === AccountType.TUTOR) {
        tutorsAndStudents.tutors = mappedUsers;
      } else if (group._id === AccountType.STUDENT) {
        tutorsAndStudents.students = mappedUsers;
      }
    });

    return tutorsAndStudents;
  } catch (error) {
    console.error("Error fetching tutors and students:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function getUserTypeById(userId: string): Promise<AccountType | null> {
  try {
    await connectToMongoDB();
    const user = await Account.findById(userId);
    return user ? user.type : null;
  } catch (error) {
    console.error("Error fetching user type:", error);
    throw new Error("Failed to fetch user type"); 
  }
}

export async function getAllUsers() : Promise<BasicAccountInfo[]>{
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type!== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }

    await connectToMongoDB();
    const users = await Account.find({});
    const formattedUsers : BasicAccountInfo[] = users.map((user) => {
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        type: user.type,
        onboarded: user.onboarded
      }
    })
    console.log("Formatted Users:", formattedUsers);
    return formattedUsers;

  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}