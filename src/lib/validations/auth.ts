import * as z from "zod"
import { AccountType } from "@/models/account"
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

export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type OnboardingFormValues = z.infer<typeof onboardingSchema>