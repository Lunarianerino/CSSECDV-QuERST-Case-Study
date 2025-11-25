import { NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/db";
import { Exam, ExamStatus, Account } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { UserExamStatus } from "@/models/examStatus";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

export async function GET() {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "exam-submissions.GET",
        message: "Not authenticated",
      });
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only admins and tutors can view submissions
    if (session.user.type !== AccountType.ADMIN && session.user.type !== AccountType.TUTOR) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: session.user?.id,
        resource: "exam-submissions.GET",
        message: "Not authorized",
      });
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

    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "success",
      userId: session.user?.id,
      resource: "exam-submissions.GET",
      message: `Fetched ${formattedSubmissions.length} exam submissions`,
    });

    return NextResponse.json(formattedSubmissions);
  } catch (error) {
    console.error("Error fetching exam submissions:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "failure",
      resource: "exam-submissions.GET",
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
