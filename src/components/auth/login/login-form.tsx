"use client";

import {useEffect, useMemo, useState} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {CheckIcon, Eye, EyeOff, Loader2} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { useMutation } from "@tanstack/react-query";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync, isPending, isError, isSuccess, error } = useMutation({
    mutationKey: ['account-login'],
    mutationFn: async (data: LoginFormValues) => {
      return await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
    },
  });

  async function onSubmit(data: LoginFormValues) {
    await mutateAsync(data);
  }

  useEffect(() => {
    if (isError) {
      toast.error(error.message, {
        id: "login",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (isSuccess) {
      router.push("/dashboard");
    }
  }, [isSuccess]);

  const buttonText = useMemo(() => {
    if (isPending) {
      return 'Logging in...';
    }
    else if (isSuccess) {
      return 'Logged in!';
    }
    else {
      return 'Log in';
    }
  }, [isPending, isSuccess]);

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
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

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="********" 
                  {...field} 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full" disabled={isPending || isSuccess}>
        {isPending && <Loader2 className="animate-spin" />}
        {isSuccess && <CheckIcon />}
        {buttonText}
      </Button>
    </form>
  </Form>
  );
}
