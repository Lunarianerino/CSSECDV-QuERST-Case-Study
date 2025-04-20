"use server";

import { connectToMongoDB } from "../db";
import { Exam, ExamStatus } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserExamStatus } from "@/models/examStatus";

export interface AssignedExam {
  id: string;
  examId: string;
  name: string;
  description: string;
  status: string;
  score?: number;
  maxScore?: number;
  completedAt?: string;
  results?: string;
}

export async function getAssignedExamsAction(): Promise<AssignedExam[]> {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Find all exams assigned to the current user
    const assignedExams = await ExamStatus.find({ userId: session.user.id }).populate({
      path: "examId",
      model: "Exam",
    });

    // Transform the data to a client-friendly format
    return assignedExams.map((examStatus: any) => {
      // Determine results status
      let results = "Not Graded";
      if (examStatus.status === UserExamStatus.FINISHED && examStatus.score !== undefined) {
        results = "Graded";
      }

      return {
        id: examStatus._id.toString(),
        examId: examStatus.examId._id.toString(),
        name: examStatus.examId.name,
        description: examStatus.examId.description,
        status: examStatus.status,
        score: examStatus.score,
        maxScore: examStatus.examId.questions?.length || 0, // Assuming 1 point per question
        completedAt: examStatus.completedAt ? examStatus.completedAt.toISOString() : undefined,
        results: results
      };
    });
  } catch (error) {
    console.error("Error fetching assigned exams:", error);
    throw new Error("Failed to fetch assigned exams");
  }
}