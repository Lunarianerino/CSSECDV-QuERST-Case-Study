"use server";

import { connectToMongoDB } from "../db";
import { Exam } from "@/models";

/**
 * Gets the forStudents and forTutors attributes of an exam
 */
export async function getExamAttributesAction(examId: string) {
  try {
    await connectToMongoDB();

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return { success: false, message: "Exam not found", data: null };
    }

    // Return exam attributes
    return {
      success: true,
      message: "Exam attributes retrieved successfully",
      data: {
        forStudents: exam.forStudents,
        forTutors: exam.forTutors,
      },
    };
  } catch (error) {
    console.error("Error retrieving exam attributes:", error);
    return { success: false, message: "Failed to retrieve exam attributes", data: null };
  }
}