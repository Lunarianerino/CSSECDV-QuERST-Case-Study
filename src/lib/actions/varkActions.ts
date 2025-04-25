"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

import { Exam, Question, Choice, Vark } from "@/models";
import { VARKAttributes } from "@/models/vark";
import mongoose from "mongoose";

// Interface for the VARK mapping data
export interface VarkMapping {
  answerId: string;
  attribute: VARKAttributes;
}

// Interface for the VARK submission data
export interface VarkSubmissionData {
  examId: string;
  mappings: VarkMapping[];
}

/**
 * Get all exams for VARK selection
 */
export async function getExamsForVarkAction() {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }
    const exams = await Exam.find({});
    
    return {
      success: true,
      message: "Exams retrieved successfully",
      data: exams.map((exam: any) => ({
        id: exam._id.toString(),
        name: exam.name,
        description: exam.description,
      })),
    };
  } catch (error) {
    console.error("Error retrieving exams:", error);
    return { success: false, message: "Failed to retrieve exams", data: null };
  }
}

/**
 * Get exam details with questions and choices for VARK assignment
 */
export async function getExamDetailsForVarkAction(examId: string) {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }
    
    // Only admins can access this functionality
    if (session?.user?.type !== "admin") {
      return { success: false, message: "Not authorized", data: null };
    }

    // Validate exam exists
    const exam = await Exam.findById(examId).populate({
      path: 'questions',
      model: 'Question',
      populate: {
        path: 'choices',
        model: 'Choice',
      },
    });

    if (!exam) {
      return { success: false, message: "Exam not found", data: null };
    }

    // Get existing VARK mappings for this exam's answers
    const existingMappings = await Vark.find({
      answerId: { $in: exam.questions.flatMap((q: any) => q.choices.map((c: any) => c._id)) }
    });

    // Create a map of answerId to attribute for quick lookup
    const mappingsMap = new Map();
    existingMappings.forEach((mapping: any) => {
      mappingsMap.set(mapping.answerId.toString(), mapping.attribute);
    });

    return {
      success: true,
      message: "Exam details retrieved successfully",
      data: {
        id: exam._id.toString(),
        name: exam.name,
        description: exam.description,
        questions: exam.questions.map((question: any) => ({
          id: question._id.toString(),
          question: question.question,
          type: question.type,
          choices: question.choices.map((choice: any) => ({
            id: choice._id.toString(),
            text: choice.text,
            isCorrect: choice.isCorrect,
            varkAttribute: mappingsMap.get(choice._id.toString()) || null,
          })),
        })),
      },
    };
  } catch (error) {
    console.error("Error retrieving exam details:", error);
    return { success: false, message: "Failed to retrieve exam details", data: null };
  }
}

/**
 * Save VARK mappings for an exam's answers
 */
export async function saveVarkMappingsAction(data: VarkSubmissionData) {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }

    // Validate exam exists
    const exam = await Exam.findById(data.examId);
    if (!exam) {
      return { success: false, message: "Exam not found" };
    }

    // Clear existing VARK mappings for this exam's answers
    // const answerIds = data.mappings.map(mapping => mapping.answerId);
    await Vark.deleteMany({});

    // Create new VARK mappings
    if (data.mappings.length > 0) {
      const varkMappings = data.mappings.map(mapping => ({
        answerId: mapping.answerId,
        attribute: mapping.attribute,
      }));

      await Vark.insertMany(varkMappings);
    }

    return { 
      success: true, 
      message: "VARK mappings saved successfully" 
    };
  } catch (error) {
    console.error("Error saving VARK mappings:", error);
    return { success: false, message: "Failed to save VARK mappings" };
  }
}