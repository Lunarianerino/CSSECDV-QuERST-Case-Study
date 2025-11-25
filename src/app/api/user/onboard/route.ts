import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToMongoDB } from '@/lib/db';
import { Account } from '@/models';
import { onboardingSchema } from '@/lib/validations/auth';
import { autoAssignExams } from '@/lib/actions/examActions';
import { getSecurityQuestionPrompt } from '@/lib/security-questions';
import { hashSync } from "bcrypt-ts";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";
//TODO: Replace with a server action
export async function POST(request: NextRequest) {
  try {
    //! There might be no need for this to be an API route, oops lol
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "user/onboard.POST",
        message: "Unauthorized",
        req: request,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = onboardingSchema.safeParse(body);
    
    if (!validationResult.success) {
      await logSecurityEvent({
        event: SecurityEvent.VALIDATION,
        outcome: "failure",
        userId: session.user?.id,
        resource: "user/onboard.POST",
        metadata: { issues: validationResult.error.format() },
        req: request,
      });
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, userType, securityQuestions } = validationResult.data;
    
    // Connect to MongoDB
    await connectToMongoDB();

    const hashedSecurityQuestions = securityQuestions.map((question) => ({
      questionId: question.questionId,
      question: getSecurityQuestionPrompt(question.questionId) ?? question.questionId,
      answerHash: hashSync(question.answer.toLowerCase(), 12),
    }));
    
    // Update the user's profile
    const updatedUser = await Account.findOneAndUpdate(
      { email: session.user.email },
      { 
        name,
        type: userType,
        onboarded: true,
        securityQuestions: hashedSecurityQuestions,
      },
      { new: true }
    );
    
    if (!updatedUser) {
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_UPDATE,
        outcome: "failure",
        userId: session.user?.id,
        resource: "user/onboard.POST",
        message: "User not found",
        req: request,
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    try {
      const assignedExams = await autoAssignExams();
    } catch (error) {
      console.error('Error in autoAssignExams:', error);
      // TODO: Handle the error, possibly log it 
    }
    
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_UPDATE,
      outcome: "success",
      userId: session.user?.id,
      resource: "user/onboard.POST",
      message: "Onboarding completed",
      req: request,
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          type: updatedUser.type,
          onboarded: updatedUser.onboarded
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in onboarding API:', error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_UPDATE,
      outcome: "failure",
      resource: "user/onboard.POST",
      message: error instanceof Error ? error.message : String(error),
      req: request,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
