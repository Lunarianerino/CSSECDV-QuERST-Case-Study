"use server";

import { connectToMongoDB } from "../db";
import { Exam, ExamAnswers, ExamStatus } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

interface GradeData {
  attemptId: string;
  scores: {
    questionId: string;
    score: number;
  }[];
  totalScore: number;
}

export async function gradeExamAction(data: GradeData) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }

    // Only admins and tutors can grade exams
    if (session.user.type !== AccountType.ADMIN && session.user.type !== AccountType.TUTOR) {
      return { success: false, message: "Not authorized to grade exams" };
    }

    // Find the exam attempt
    const examAttempt = await ExamStatus.findById(data.attemptId).populate({
      path: "examId",
      model: "Exam",
    });

    if (!examAttempt) {
      return { success: false, message: "Exam attempt not found" };
    }

    // Verify the user is authorized to grade this exam
    // Admins can grade any exam, tutors can only grade exams they created
    if (
      session.user.type !== AccountType.ADMIN &&
      examAttempt.examId.createdBy.toString() !== session.user.id
    ) {
      return { success: false, message: "Not authorized to grade this exam" };
    }

    // Update scores for each question's answer
    for (const scoreData of data.scores) {
      const answer = await ExamAnswers.findOne({
        questionId: scoreData.questionId,
        attemptId: data.attemptId,
      });

      if (answer) {
        answer.score = scoreData.score;
        await answer.save();
      }
    }

    // Update the total score in the exam status
    examAttempt.score = data.totalScore;
    await examAttempt.save();

    return { success: true, message: "Exam graded successfully" };
  } catch (error) {
    console.error("Error grading exam:", error);
    return { success: false, message: "Failed to grade exam" };
  }
}