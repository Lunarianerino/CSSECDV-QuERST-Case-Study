"use server";

import { connectToMongoDB } from "../db";
import { Exam } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

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
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "updateExamAttributesAction",
        message: "Not authenticated",
      });
      return { success: false, message: "Not authenticated" };
    }

    // Only admins can update exam attributes
    if (session.user.type !== AccountType.ADMIN) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: session.user?.id,
        resource: "updateExamAttributesAction",
        message: "Not authorized",
      });
      return { success: false, message: "Not authorized" };
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_UPDATE,
        outcome: "failure",
        userId: session.user?.id,
        resource: "updateExamAttributesAction",
        message: "Exam not found",
      });
      return { success: false, message: "Exam not found" };
    }

    // Update exam attributes
    exam.forStudents = forStudents;
    exam.forTutors = forTutors;
    exam.disabled = isDisabled;
    // console.log(exam);
    await exam.save();

    await logSecurityEvent({
      event: SecurityEvent.OPERATION_UPDATE,
      outcome: "success",
      userId: session.user?.id,
      resource: "updateExamAttributesAction",
      message: `Updated exam attributes for ${examId}`,
    });

    return {
      success: true,
      message: "Exam attributes updated successfully",
    };
  } catch (error) {
    console.error("Error updating exam attributes:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_UPDATE,
      outcome: "failure",
      resource: "updateExamAttributesAction",
      message: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to update exam attributes" };
  }
}
