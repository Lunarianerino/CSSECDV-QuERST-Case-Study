"use server"
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from 'next/link'
import LoginForm from "@/components/auth/login/login-form";
const Page = async () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Tutor/Student!</CardTitle>
          <CardDescription>
            Please enter your details to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm/>
        </CardContent>
        <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary underline hover:text-primary/80">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;
