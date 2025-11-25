import * as z from "zod"
import { AccountType } from "@/models/account"
import { isValidSecurityQuestionId } from "@/lib/security-questions"

const securityQuestionAnswerSchema = z.object({
	questionId: z.string().refine(isValidSecurityQuestionId, {
		message: "Select a valid security question",
	}),
	answer: z
		.string()
		.min(3, { message: "Answer must be at least 3 characters" })
		.max(128, { message: "Answer must be at most 128 characters" })
		.regex(/^(?!\s*$).+/, { message: "Answer cannot be empty" })
		.refine(val => !/^[0-9]{8,}$/.test(val), {
			message: "Answer must include letters or symbols",
		})
		.refine(val => !/(.)\1{3,}/.test(val), {
			message: "Answer must not repeat the same character 4+ times",
		}),
});
export const registerSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(12, { message: "Password must be at least 12 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/^(?!.*(123|234|345|456|567|678|789|012|ABC|BCD|CDE|DEF|abc|bcd|cde|def))/, {
			message: "Password must not contain common patterns"
		}) // added
		.regex(/^(?!.*(.)\1\1)/, {
			message: "Password must not contain three or more repeating characters"
		}) // added 
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
})

export const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z.string().min(1, { message: "Please enter your password" }),
})

export const onboardingSchema = z.object({
	name: z.string().min(2, { message: "Name must be at least 2 characters" }),
	userType: z.enum([AccountType.STUDENT, AccountType.TUTOR], {
		required_error: "Please select a user type",
	}),
	securityQuestions: z.array(securityQuestionAnswerSchema)
		.min(3, { message: "Please select 3 security questions" })
		.max(3, { message: "Please select 3 security questions" })
		.refine(questions => {
			const ids = questions.map(q => q.questionId);
			return new Set(ids).size === ids.length;
		}, { message: "Security questions must be unique", path: ["securityQuestions"] }),
})

export const createUserSchema = z.object({
	name: z.string().min(2, { message: "Name must be at least 2 characters" }),
	userType: z.enum([AccountType.STUDENT, AccountType.TUTOR], {
		required_error: "Please select a user type",
	}),
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(12, { message: "Password must be at least 12 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/^(?!.*(123|234|345|456|567|678|789|012|ABC|BCD|CDE|DEF|abc|bcd|cde|def))/, {
			message: "Password must not contain common patterns"
		}) // added
		.regex(/^(?!.*(.)\1\1)/, {
			message: "Password must not contain three or more repeating characters"
		}) // added 
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
})

export const changePasswordSchema = z.object({
	oldPassword: z.string(),
	newPassword: z
		.string()
		.min(12, { message: "Password must be at least 12 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/^(?!.*(123|234|345|456|567|678|789|012|ABC|BCD|CDE|DEF|abc|bcd|cde|def))/, {
			message: "Password must not contain common patterns"
		}) // added
		.regex(/^(?!.*(.)\1\1)/, {
			message: "Password must not contain three or more repeating characters"
		}) // added 
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
}).refine(data => data.newPassword !== data.oldPassword, {
	message: "Old and new passwords should not be the same",
	path: ["newPassword"]
})

export const forgotPasswordStartSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
});

export const verifySecurityQuestionsSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	token: z.string().min(1, { message: "Reset token is required" }),
	answers: z.array(securityQuestionAnswerSchema)
		.min(3, { message: "Please answer all security questions" })
		.max(3, { message: "Please answer all security questions" }),
});

export const resetPasswordWithTokenSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	token: z.string().min(1, { message: "Reset token is required" }),
	newPassword: z
		.string()
		.min(12, { message: "Password must be at least 12 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/^(?!.*(123|234|345|456|567|678|789|012|ABC|BCD|CDE|DEF|abc|bcd|cde|def))/, {
			message: "Password must not contain common patterns"
		})
		.regex(/^(?!.*(.)\1\1)/, {
			message: "Password must not contain three or more repeating characters"
		})
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
});

export const adminSetPasswordSchema = z.object({
	newPassword: z
		.string()
		.min(12, { message: "Password must be at least 12 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/^(?!.*(123|234|345|456|567|678|789|012|ABC|BCD|CDE|DEF|abc|bcd|cde|def))/, {
			message: "Password must not contain common patterns"
		})
		.regex(/^(?!.*(.)\1\1)/, {
			message: "Password must not contain three or more repeating characters"
		})
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
});

export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type OnboardingFormValues = z.infer<typeof onboardingSchema>
export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
export type ForgotPasswordStartValues = z.infer<typeof forgotPasswordStartSchema>
export type VerifySecurityQuestionsValues = z.infer<typeof verifySecurityQuestionsSchema>
export type ResetPasswordWithTokenValues = z.infer<typeof resetPasswordWithTokenSchema>
export type AdminSetPasswordValues = z.infer<typeof adminSetPasswordSchema>
