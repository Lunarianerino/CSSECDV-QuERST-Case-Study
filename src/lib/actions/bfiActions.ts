"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

import { Exam, Question, Choice, Bfi } from "@/models";
import { BFIAttributes } from "@/models/bfi";
import mongoose from "mongoose";

// Interface for the BFI mapping data
export interface BfiMapping {
  answerId: string;
  attribute: BFIAttributes;
  isReversed: boolean;
}

// Interface for the BFI submission data
export interface BfiSubmissionData {
  examId: string;
  mappings: BfiMapping[];
}

/**
 * Get all exams for BFI selection
 */
export async function getExamsForBfiAction() {
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
 * Get exam details with questions and choices for BFI assignment
 */
export async function getExamDetailsForBfiAction(examId: string) {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
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

    // Get existing BFI mappings for this exam's answers
    const existingMappings = await Bfi.find({
      answerId: { $in: exam.questions.flatMap((q: any) => q.choices.map((c: any) => c._id)) }
    });

    // Create a map of answerId to attribute and isReversed for quick lookup
    const mappingsMap = new Map();
    existingMappings.forEach((mapping: any) => {
      mappingsMap.set(mapping.answerId.toString(), {
        attribute: mapping.attribute,
        isReversed: mapping.isReversed
      });
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
          choices: question.choices.map((choice: any) => {
            const mapping = mappingsMap.get(choice._id.toString());
            return {
              id: choice._id.toString(),
              text: choice.text,
              isCorrect: choice.isCorrect,
              bfiAttribute: mapping ? mapping.attribute : null,
              isReversed: mapping ? mapping.isReversed : false,
            };
          }),
        })),
      },
    };
  } catch (error) {
    console.error("Error retrieving exam details:", error);
    return { success: false, message: "Failed to retrieve exam details", data: null };
  }
}

/**
 * Save BFI mappings for an exam's answers
 */
export async function saveBfiMappingsAction(data: BfiSubmissionData) {
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

    // Clear existing BFI mappings
    await Bfi.deleteMany({});

    // Create new BFI mappings
    if (data.mappings.length > 0) {
      const bfiMappings = data.mappings.map(mapping => ({
        answerId: mapping.answerId,
        attribute: mapping.attribute,
        isReversed: mapping.isReversed,
      }));

      await Bfi.insertMany(bfiMappings);
    }

    return { 
      success: true, 
      message: "BFI mappings saved successfully" 
    };
  } catch (error) {
    console.error("Error saving BFI mappings:", error);
    return { success: false, message: "Failed to save BFI mappings" };
  }
}