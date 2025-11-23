"use server";

import { connectToMongoDB } from "../db";
import { Exam } from "@/models";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

/**
 * Gets the forStudents and forTutors attributes of an exam
 */
export async function getExamAttributesAction(examId: string) {
  try {
    await connectToMongoDB();

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_READ,
        outcome: "failure",
        resource: "getExamAttributesAction",
        message: "Exam not found",
      });
      return { success: false, message: "Exam not found", data: null };
    }

    // Return exam attributes
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "success",
      resource: "getExamAttributesAction",
      message: `Retrieved exam attributes for ${examId}`,
    });
    return {
      success: true,
      message: "Exam attributes retrieved successfully",
      data: {
        forStudents: exam.forStudents,
        forTutors: exam.forTutors,
        disabled: exam.disabled,
      },
    };
  } catch (error) {
    console.error("Error retrieving exam attributes:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "failure",
      resource: "getExamAttributesAction",
      message: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to retrieve exam attributes", data: null };
  }
}
