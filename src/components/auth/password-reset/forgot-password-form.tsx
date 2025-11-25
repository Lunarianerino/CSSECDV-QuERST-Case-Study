"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  ForgotPasswordStartValues,
  ResetPasswordWithTokenValues,
  VerifySecurityQuestionsValues,
  forgotPasswordStartSchema,
  resetPasswordWithTokenSchema,
  verifySecurityQuestionsSchema,
} from "@/lib/validations/auth";
import { useRouter } from "next/navigation";

type Step = "email" | "questions" | "reset";
type ResetQuestion = { questionId: string; prompt: string };

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [questions, setQuestions] = useState<ResetQuestion[]>([]);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<ForgotPasswordStartValues>({
    resolver: zodResolver(forgotPasswordStartSchema),
    defaultValues: { email: "" },
  });

  const questionForm = useForm<VerifySecurityQuestionsValues>({
    resolver: zodResolver(verifySecurityQuestionsSchema),
    defaultValues: { email: "", token: "", answers: [] },
  });

  const resetForm = useForm<ResetPasswordWithTokenValues>({
    resolver: zodResolver(resetPasswordWithTokenSchema),
    defaultValues: { email: "", token: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (questions.length && token && email) {
      questionForm.reset({
        email,
        token,
        answers: questions.map((q) => ({ questionId: q.questionId, answer: "" })),
      });
    }
  }, [questions, token, email, questionForm]);

  useEffect(() => {
    if (token && email) {
      resetForm.reset({
        email,
        token,
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [token, email, resetForm]);

  const isEmailStep = step === "email";
  const isQuestionsStep = step === "questions";
  const isResetStep = step === "reset";

  const emailButtonText = useMemo(() => {
    if (emailForm.formState.isSubmitting) return "Loading questions...";
    return "Send security questions";
  }, [emailForm.formState.isSubmitting]);

  const questionButtonText = useMemo(() => {
    if (questionForm.formState.isSubmitting) return "Verifying...";
    return "Verify answers";
  }, [questionForm.formState.isSubmitting]);

  const resetButtonText = useMemo(() => {
    if (resetForm.formState.isSubmitting) return "Resetting...";
    return "Reset password";
  }, [resetForm.formState.isSubmitting]);

  async function handleStart(values: ForgotPasswordStartValues) {
    try {
      const res = await fetch("/api/auth/forgot-password/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start password reset");
      }
      setQuestions(data.questions || []);
      setToken(data.token);
      setEmail(values.email);
      setStep("questions");
      toast.success("Answer your security questions to continue.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start reset";
      toast.error(message);
    }
  }

  async function handleVerify(values: VerifySecurityQuestionsValues) {
    try {
      const payload = { ...values, email, token };
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed");
      }
      setStep("reset");
      toast.success("Identity verified. Set a new password.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify answers";
      toast.error(message);
    }
  }

  async function handleReset(values: ResetPasswordWithTokenValues) {
    try {
      const payload = { ...values, email, token };
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }
      toast.success("Password reset. Please log in.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset password";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      {isEmailStep && (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleStart)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {emailButtonText}
            </Button>
          </form>
        </Form>
      )}

      {isQuestionsStep && (
        <Form {...questionForm}>
          <form onSubmit={questionForm.handleSubmit(handleVerify)} className="space-y-4">
            {questions.map((question, index) => (
              <FormField
                key={question.questionId}
                control={questionForm.control}
                name={`answers.${index}.answer`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{question.prompt}</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your answer" {...field} />
                    </FormControl>
                    <FormMessage />
                    <input type="hidden" {...questionForm.register(`answers.${index}.questionId`)} />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" className="w-full" disabled={questionForm.formState.isSubmitting}>
              {questionForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {questionButtonText}
            </Button>
          </form>
        </Form>
      )}

      {isResetStep && (
        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>
              {resetForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resetButtonText}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
