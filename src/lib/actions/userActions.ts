"use server";
import { connectToMongoDB } from "../db";
import { Account } from "@/models";
import { AccountType } from "@/models/account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BasicAccountInfo } from "@/types/accounts";
import { CreateUserFormValues, ResetPasswordWithTokenValues, adminSetPasswordSchema, changePasswordSchema } from "@/lib/validations/auth";
import { compareSync } from "bcrypt-ts";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";
import { createHash } from "crypto";


/**
 * Alternative implementation using aggregation pipeline
 * This is more efficient for large datasets as it only requires one database query
 */
export async function getTutorsAndStudentsAggregation() {
	try {
		// Check if user is authorized (admin only)
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "getTutorsAndStudentsAggregation",
				message: "Not authorized",
			});
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
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "failure",
			resource: "getTutorsAndStudentsAggregation",
			message: error instanceof Error ? error.message : String(error),
		});
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
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "failure",
			resource: "getUserTypeById",
			message: error instanceof Error ? error.message : String(error),
		});
		throw new Error("Failed to fetch user type");
	}
}

export async function getAllUsers(): Promise<BasicAccountInfo[]> {
	try {
		// Check if user is authorized (admin only)
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "getAllUsers",
				message: "Not authorized",
			});
			throw new Error("Not authorized to access user data");
		}

		await connectToMongoDB();
		const users = await Account.find({});
		const formattedUsers: BasicAccountInfo[] = users.map((user) => {
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
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "success",
			userId: session.user?.id,
			resource: "getAllUsers",
			message: `Fetched ${formattedUsers.length} users`,
		});
		return formattedUsers;

	} catch (error) {
		console.error("Error fetching users:", error);
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "failure",
			resource: "getAllUsers",
			message: error instanceof Error ? error.message : String(error),
		});
		throw new Error("Failed to fetch users");
	}
}

export interface UserActionResponse {
	success: boolean;
	error?: string;
	status: number;
	data?: BasicAccountInfo;
}

export async function createUser(form: CreateUserFormValues): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "createUser",
				message: "Unauthorized action",
			});
			return {
				success: false,
				error: "Unauthorized action",
				status: 401
			}
		}

		await connectToMongoDB();

		// Create account
		const userFound = await Account.findOne({ email: form.email });

		if (userFound) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_CREATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "createUser",
				message: "User already exists",
			});
			return {
				success: false,
				error: "User already exists",
				status: 422
			}
		}
		const user = new Account({
			name: form.name,
			email: form.email,
			password: form.password,
			type: form.userType,
			onboarded: false
		})

		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_CREATE,
			outcome: "success",
			userId: session.user?.id,
			resource: "createUser",
			message: `Created user ${form.email}`,
		});

		return {
			success: true,
			status: 200
		}
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_CREATE,
			outcome: "failure",
			resource: "createUser",
			message: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			error: "Internal Server Error",
			status: 500
		};
	}
}

export async function disableUser(disabled: boolean, userId: string): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "disableUser",
				message: "Unauthorized action",
			});
			return {
				success: false,
				error: "Unauthorized action",
				status: 401
			}
		}


		await connectToMongoDB();
		const user = await Account.findById(userId);

		if (session.user.id === userId || user.type === AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session.user?.id,
				resource: "disableUser",
				message: "Attempt to disable self/admin",
			});
			return {
				success: false,
				error: "This account can't be disabled",
				status: 401
			}
		}

		const updatedUser = await Account.findByIdAndUpdate(userId, { disabled: disabled }, { new: true });


		if (updatedUser) {
			const formattedUpdatedUser: BasicAccountInfo = {
				id: updatedUser._id.toString(),
				name: updatedUser.name,
				email: updatedUser.email,
				type: updatedUser.type,
				onboarded: updatedUser.onboarded,
				disabled: updatedUser.disabled,
			}
			//console.log("updatedUser:", updatedUser);
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "success",
				userId: session.user?.id,
				resource: "disableUser",
				message: `${disabled ? "Disabled" : "Enabled"} user ${userId}`,
			});
			return {
				success: true,
				status: 200,
				data: formattedUpdatedUser
			}
		} else {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "disableUser",
				message: "User does not exist",
			});
			return {
				success: false,
				status: 404,
				error: "User does not exist"
			}
		}
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "disableUser",
			message: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			status: 500,
			error: "Internal Server Error",
		}
	}
}

export async function togglePermanentBan(disabled: boolean, userId: string): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "togglePermanentBan",
				message: "Unauthorized action",
			});
			return { success: false, status: 401, error: "Unauthorized action" };
		}

		await connectToMongoDB();
		const user = await Account.findById(userId);

		if (!user || user.type === AccountType.ADMIN || userId === session.user.id) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session.user?.id,
				resource: "togglePermanentBan",
				message: "Attempt to ban self/admin or user not found",
			});
			return { success: false, status: 401, error: "This account can't be updated" };
		}

		user.disabled = disabled;
		await user.save();

		const formatted: BasicAccountInfo = {
			id: user._id.toString(),
			name: user.name,
			email: user.email,
			type: user.type,
			onboarded: user.onboarded,
			disabled: user.disabled,
		};

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			userId: session.user?.id,
			resource: "togglePermanentBan",
			message: `${disabled ? "Permanently disabled" : "Unbanned"} user ${userId}`,
		});

		return { success: true, status: 200, data: formatted };
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "togglePermanentBan",
			message: error instanceof Error ? error.message : String(error),
		});
		return { success: false, status: 500, error: "Internal Server Error" };
	}
}

export async function updateUserOnboardedStatus(onboarded: boolean, userId: string): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "updateUserOnboardedStatus",
				message: "Unauthorized action",
			});
			return { success: false, status: 401, error: "Unauthorized action" };
		}

		await connectToMongoDB();
		const user = await Account.findById(userId);

		if (!user || user.type === AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session.user?.id,
				resource: "updateUserOnboardedStatus",
				message: "Attempt to modify self/admin or user not found",
			});
			return { success: false, status: 401, error: "This account can't be updated" };
		}

		user.onboarded = onboarded;
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			userId: session.user?.id,
			resource: "updateUserOnboardedStatus",
			message: `Set onboarded=${onboarded} for user ${userId}`,
		});

		return {
			success: true,
			status: 200,
			data: {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				type: user.type,
				onboarded: user.onboarded,
				disabled: user.disabled,
			},
		};
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "updateUserOnboardedStatus",
			message: error instanceof Error ? error.message : String(error),
		});
		return { success: false, status: 500, error: "Internal Server Error" };
	}
}

export async function adminChangeUserPassword(userId: string, newPassword: string, confirmPassword: string): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user?.type !== AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session?.user?.id,
				resource: "adminChangeUserPassword",
				message: "Unauthorized action",
			});
			return { success: false, status: 401, error: "Unauthorized action" };
		}

		const parsed = adminSetPasswordSchema.parse({ newPassword, confirmPassword });

		await connectToMongoDB();
		const user = await Account.findById(userId);
		if (!user) {
			return { success: false, status: 404, error: "User does not exist" };
		}
		if (user.type === AccountType.ADMIN) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session.user?.id,
				resource: "adminChangeUserPassword",
				message: "Attempt to change another admin's password",
			});
			return { success: false, status: 401, error: "This account can't be updated" };
		}

		const history = user.passwordHistory || [];
		const reused =
			compareSync(parsed.newPassword, user.password) ||
			history.some((entry) => compareSync(parsed.newPassword, entry.hash));

		if (reused) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "adminChangeUserPassword",
				message: "Password reuse detected",
			});
			return { success: false, status: 400, error: "Cannot reuse a recent password" };
		}

		const updatedHistory = [
			{ hash: user.password, changedAt: new Date() },
			...(history ?? []),
		].slice(0, 5);

		user.passwordHistory = updatedHistory;
		user.password = parsed.newPassword;
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			userId: session.user?.id,
			resource: "adminChangeUserPassword",
			message: `Password changed for user ${userId}`,
		});

		return { success: true, status: 200 };
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "adminChangeUserPassword",
			message: error instanceof Error ? error.message : String(error),
		});
		return { success: false, status: 500, error: "Internal Server Error" };
	}
}

export async function changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<UserActionResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "changePassword",
				message: "Unauthorized action",
			});
			return {
				success: false,
				error: "Unauthorized action",
				status: 401
			}
		}
		if (newPassword !== confirmPassword) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "New password mismatch",
			});
			return {
				success: false,
				error: "New password and confirm password do not match",
				status: 400
			}
		}

		if (oldPassword == newPassword) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "New password equals old password",
			});
			return {
				success: false,
				error: "New password cannot be the same as the old one",
				status: 400
			}
		}

		await connectToMongoDB();
		const user = await Account.findById(session.user.id);
		if (!user) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "User does not exist",
			});
			return {
				success: false,
				error: "User does not exist",
				status: 404
			}
		}
		// Verify old password against stored hash (re-authenticate)
		const oldPasswordMatches = compareSync(oldPassword, user.password);

		if (!oldPasswordMatches) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "Old password incorrect",
			});
			return {
				success: false,
				error: "Old password is incorrect",
				status: 400,
			};
		}

		const MIN_AGE_MS = 24 * 60 * 60 * 1000;
		const now = Date.now();
		const lastChanged = user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0;
		console.log(lastChanged);
		if (now - lastChanged < MIN_AGE_MS) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "Password changed too recently",
			});
			return {
				success: false,
				error: "Password was changed less than 24 hours ago",
				status: 400,
			};
		}
		
		// after verifying oldPassword matches and before setting the new one
		const history = user.passwordHistory || [];

		const reused =
			compareSync(newPassword, user.password) ||
			history.some((entry) => compareSync(newPassword, entry.hash));

		if (reused) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				userId: session.user?.id,
				resource: "changePassword",
				message: "Password reuse detected",
			});
			return {
				success: false,
				error: "You cannot reuse a recent password",
				status: 400,
			};
		}

		// keep old hash, trim to depth 5
		const updatedHistory = [
			{ hash: user.password, changedAt: new Date() },
			...history,
		].slice(0, 5);

		user.passwordHistory = updatedHistory;
		user.password = newPassword; // pre-save hook will hash this
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			userId: session.user?.id,
			resource: "changePassword",
			message: "Password changed successfully",
		});

		return {
			success: true,
			status: 200,
		};
	} catch (error) {
		console.log(error);
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "changePassword",
			message: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			status: 500,
			error: "Internal Server Error",
		}
	}

}

export async function resetPasswordWithSecurityToken(input: ResetPasswordWithTokenValues): Promise<UserActionResponse> {
	try {
		const { email, token, newPassword, confirmPassword } = input;

		if (newPassword !== confirmPassword) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "New password mismatch",
				email,
			});
			return { success: false, status: 400, error: "Passwords do not match" };
		}

		await connectToMongoDB();
		const user = await Account.findOne({ email });
		if (!user || !user.passwordReset || !user.passwordReset.tokenHash) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Invalid or expired token",
				email,
			});
			return { success: false, status: 400, error: "Invalid or expired reset request" };
		}

		if (user.disabled) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Account permanently disabled",
				email,
			});
			return { success: false, status: 403, error: "Permanently banned, please contact administrator for help" };
		}

		if (!user.passwordReset.expiresAt || user.passwordReset.expiresAt.getTime() < Date.now()) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Reset token expired",
				email,
			});
			user.passwordReset = undefined;
			await user.save();
			return { success: false, status: 400, error: "Reset token expired" };
		}

		if (!user.passwordReset.verified) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Identity not verified",
				email,
			});
			return { success: false, status: 400, error: "Identity not verified" };
		}

		const providedHash = createHash("sha256").update(token).digest("hex");
		if (providedHash !== user.passwordReset.tokenHash) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Invalid token hash",
				email,
			});
			return { success: false, status: 400, error: "Invalid or expired reset request" };
		}

		const history = user.passwordHistory || [];
		const reused =
			compareSync(newPassword, user.password) ||
			history.some((entry) => compareSync(newPassword, entry.hash));

		if (reused) {
			await logSecurityEvent({
				event: SecurityEvent.OPERATION_UPDATE,
				outcome: "failure",
				resource: "resetPasswordWithSecurityToken",
				message: "Password reuse detected",
				email,
			});
			return {
				success: false,
				status: 400,
				error: "You cannot reuse a recent password",
			};
		}

		const updatedHistory = [
			{ hash: user.password, changedAt: new Date() },
			...(history ?? []),
		].slice(0, 5);

		user.passwordHistory = updatedHistory;
		user.password = newPassword; // pre-save hook will hash this
		user.passwordReset = undefined; // clear reset token
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			userId: user._id.toString(),
			resource: "resetPasswordWithSecurityToken",
			message: "Password reset via security questions",
			email,
		});

		return { success: true, status: 200 };
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "resetPasswordWithSecurityToken",
			message: error instanceof Error ? error.message : String(error),
		});
		return { success: false, status: 500, error: "Internal Server Error" };
	}
}
