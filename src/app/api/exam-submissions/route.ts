import { NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/db";
import { Exam, ExamStatus, Account } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { UserExamStatus } from "@/models/examStatus";

export async function GET() {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only admins and tutors can view submissions
    if (session.user.type !== AccountType.ADMIN && session.user.type !== AccountType.TUTOR) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build query based on user type
    let query = {};
    
    if (session.user.type === AccountType.TUTOR) {
      // Tutors can only see submissions for exams they created
      const createdExams = await Exam.find({ createdBy: session.user.id });
      const examIds = createdExams.map(exam => exam._id);
      query = { examId: { $in: examIds } };
    }

    // Find all submissions (with filter for tutors)
    const submissions = await ExamStatus.find({
      ...query,
      status: UserExamStatus.FINISHED, // Only show finished exams
    })
    .populate({
      path: "examId",
      model: "Exam",
      select: "name graded createdBy"
    })
    .populate({
      path: "userId",
      model: "Account",
      select: "name email"
    })
    .sort({ completedAt: -1 });

    // Format the response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id.toString(),
      examId: submission.examId._id.toString(),
      examName: submission.examId.name,
      userId: submission.userId._id.toString(),
      userName: submission.userId.name,
      status: submission.status,
      completedAt: submission.completedAt ? submission.completedAt.toISOString() : undefined,
      attemptNumber: submission.attemptNumber,
      score: submission.score,
      graded: submission.examId.graded
    }));

    return NextResponse.json(formattedSubmissions);
  } catch (error) {
    console.error("Error fetching exam submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}