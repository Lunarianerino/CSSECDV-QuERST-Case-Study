"use server";

import { connectToMongoDB } from "../db";
import { Exam } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

/**
 * Updates the forStudents and forTutors attributes of an exam
 */
export async function updateExamAttributesAction(
  examId: string,
  forStudents: boolean,
  forTutors: boolean,
  isDisabled: boolean,
) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }

    // Only admins can update exam attributes
    if (session.user.type !== AccountType.ADMIN) {
      return { success: false, message: "Not authorized" };
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return { success: false, message: "Exam not found" };
    }

    // Update exam attributes
    exam.forStudents = forStudents;
    exam.forTutors = forTutors;
    exam.disabled = isDisabled;
    // console.log(exam);
    await exam.save();

    return {
      success: true,
      message: "Exam attributes updated successfully",
    };
  } catch (error) {
    console.error("Error updating exam attributes:", error);
    return { success: false, message: "Failed to update exam attributes" };
  }
}