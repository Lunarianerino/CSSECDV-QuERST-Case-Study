"use server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import OnboardingForm from '@/components/auth/onboarding/onboarding-form';
const Page = async () => {
  // TODO: check if user is already onboarded and redirect to dashboard if successful
  // TODO: make the form into its own component

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide some additional information to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;