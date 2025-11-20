"use server";
import { connectToMongoDB } from "../db";
import { Account } from "@/models";
import { AccountType } from "@/models/account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BasicAccountInfo } from "@/types/accounts";
import {CreateUserFormValues} from "@/lib/validations/auth";


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
          updatedAt: 1,
	        disabled: 1
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
        email: user.email,
	      disabled: user.disabled,
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
        onboarded: user.onboarded,
	      disabled: user.disabled,
      }
    })
    // console.log("Formatted Users:", formattedUsers);
    return formattedUsers;

  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

export interface UserActionResponse {
	success: boolean;
	error?: string;
	status: number;
	data?: BasicAccountInfo;
}

export async function createUser(form: CreateUserFormValues) : Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type!== AccountType.ADMIN) {
			return {
				success: false,
				error: "Unauthorized action",
				status: 401
			}
		}

		await connectToMongoDB();

		// Create account
		const userFound = await Account.findOne({ email: form.email });

		if(userFound){
			return {
				success: false,
				error: "User already exists",
				status: 422
			}
		}
		const user = new Account ({
			name: form.name,
			email: form.email,
			password: form.password,
			type: form.userType,
			onboarded: true
		})

		await user.save();

		return {
			success: true,
			status: 200
		}
	} catch (error) {
		return {
			success: false,
			error: "Internal Server Error",
			status: 500
		};
	}
}

export async function disableUser (disabled: boolean, userId: string) : Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type!== AccountType.ADMIN) {
			return {
				success: false,
				error: "Unauthorized action",
				status: 401
			}
		}


		await connectToMongoDB();
		const user = await Account.findById(userId);

		if (session.user.id === userId || user.type === AccountType.ADMIN) {
			return {
				success: false,
				error: "This account can't be disabled",
				status: 401
			}
		}

		const updatedUser = await Account.findByIdAndUpdate(userId, {disabled: disabled}, {new: true});


		if (updatedUser) {
			const formattedUpdatedUser: BasicAccountInfo = {
				id: updatedUser._id.toString(),
				name: updatedUser.name,
				email: updatedUser.email,
				type: updatedUser.type,
				onboarded: updatedUser.onboarded,
				disabled: updatedUser.disabled,
			}
			console.log("updatedUser:", updatedUser);
			return {
				success: true,
				status: 200,
				data: formattedUpdatedUser
			}
		} else {
			return {
				success: false,
				status: 404,
				error: "User does not exist"
			}
		}
	} catch (error) {
		return {
			success: false,
			status: 500,
			error: "Internal Server Error",
		}
	}
}