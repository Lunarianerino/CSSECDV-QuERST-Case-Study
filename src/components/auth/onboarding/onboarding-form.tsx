"use client";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { onboardingSchema, OnboardingFormValues } from '@/lib/validations/auth';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { AccountType } from '@/models/account'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SECURITY_QUESTION_BANK } from "@/lib/security-questions";
//TODO: Toast Context loading and status
export default function OnboardingForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false); 
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      userType: undefined,
      securityQuestions: SECURITY_QUESTION_BANK.slice(0, 3).map((question) => ({
        questionId: question.id,
        answer: "",
      })),
    },
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "securityQuestions",
  });

  const selectedQuestionIds = form.watch("securityQuestions")?.map((q) => q.questionId) ?? [];

  useEffect(() => {
    const name = session?.user?.name;
    const type = session?.user?.type;
    if (name) {
      form.setValue("name", name);
    }
    if (type && (type === AccountType.STUDENT || type === AccountType.TUTOR)) {
      form.setValue("userType", type);
    }
  }, [session?.user?.name, session?.user?.type, form]);

  async function onSubmit(data: OnboardingFormValues) {    
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // console.log('Onboarding response:', response);
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      if (response.ok) {
        const updatedSession = await response.json();
        await update({
          user: {...updatedSession.user},
        });
      }
      // console.log('Onboarding successful');
      // Redirect to dashboard
      router.push('/schedule');
    } catch (error) {
      console.error('Onboarding error:', error);
      setIsLoading(false);

    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={AccountType.STUDENT} />
                    </FormControl>
                    <FormLabel className="font-normal">Student</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={AccountType.TUTOR} />
                    </FormControl>
                    <FormLabel className="font-normal">Tutor</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel className="text-base font-medium">Security Questions</FormLabel>
          <p className="text-sm text-muted-foreground">
            Choose three questions and set answers you can recall. Answers are required to reset your password.
          </p>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border p-3">
                <FormField
                  control={form.control}
                  name={`securityQuestions.${index}.questionId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question {index + 1}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full truncate">
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECURITY_QUESTION_BANK.map((question) => (
                              <SelectItem
                                key={question.id}
                                value={question.id}
                                disabled={
                                  selectedQuestionIds.includes(question.id) &&
                                  field.value !== question.id
                                }
                              >
                                {question.prompt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`securityQuestions.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
          {form.formState.errors.securityQuestions?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.securityQuestions.message.toString()}
            </p>
          )}
        </div>
  
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Complete Onboarding'}
        </Button>
      </form>
    </Form>
  )
}
