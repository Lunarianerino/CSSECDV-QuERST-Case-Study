"use server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ForgotPasswordForm from "@/components/auth/password-reset/forgot-password-form";

const Page = async () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Forgot password</CardTitle>
          <CardDescription>
            Verify your identity with your security questions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
