import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToMongoDB } from '@/lib/db';
import Account from '@/models/account';
import { onboardingSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = onboardingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, userType } = validationResult.data;
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Update the user's profile
    const updatedUser = await Account.findOneAndUpdate(
      { email: session.user.email },
      { 
        name,
        type: userType,
        onboarded: true 
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}