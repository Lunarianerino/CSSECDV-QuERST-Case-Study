import * as z from "zod"
import { AccountType } from "@/models/account"
import data from "@mongodb-js/saslprep/dist/code-points-data-browser";
export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
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
})

export const createUserSchema = z.object({
	name: z.string().min(2, { message: "Name must be at least 2 characters" }),
	userType: z.enum([AccountType.STUDENT, AccountType.TUTOR], {
		required_error: "Please select a user type",
	}),
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
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
		.min(8, { message: "Password must be at least 8 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
	confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
}).refine(data => data.newPassword !== data.oldPassword, {
	message: "Old and new passwords should not be the same",
	path: ["newPassword"]
})

export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type OnboardingFormValues = z.infer<typeof onboardingSchema>
export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>