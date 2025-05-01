"use server";

import { connectToMongoDB } from "../db";
import { Exam, ExamStatus } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserExamStatus } from "@/models/examStatus";
import { ExamTypes } from "@/models/exam";
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
  attemptNumber?: number;
  type: string;
  disabled: boolean;
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

    const filteredExams = assignedExams.filter(e => e.examId.disabled === false || e.examId.disabled === undefined || e.examId.disabled === null);
    // Transform the data to a client-friendly format
    return filteredExams.map((examStatus: any) => {
      // Determine results status
      let results = "Not Graded";
      if (examStatus.status === UserExamStatus.FINISHED && examStatus.score !== undefined) {
        results = "Graded";
      }

      // console.log(examStatus.examId.type)
      return {
        id: examStatus._id.toString(),
        examId: examStatus.examId._id.toString(),
        name: examStatus.examId.name,
        description: examStatus.examId.description,
        status: examStatus.status,
        score: examStatus.score,
        maxScore: examStatus.examId.questions?.length || 0, // Assuming 1 point per question
        completedAt: examStatus.completedAt ? examStatus.completedAt.toISOString() : undefined,
        results: results,
        attemptNumber: examStatus.attemptNumber ? examStatus.attemptNumber : 1,
        type: examStatus.examId.type ? examStatus.examId.type : ExamTypes.OTHERS,
        disabled: examStatus.examId.disabled? examStatus.examId.disabled : false,
      };
    });
  } catch (error) {
    console.error("Error fetching assigned exams:", error);
    throw new Error("Failed to fetch assigned exams");
  }
}