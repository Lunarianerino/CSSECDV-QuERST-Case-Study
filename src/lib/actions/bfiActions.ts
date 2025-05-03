"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

import { Exam, Question, Choice, Bfi, SpecialExam } from "@/models";
import { BFIAttributes } from "@/models/bfi";
import { ExamTypes } from "@/models/exam";
import { ExamTags } from "@/models/specialExam";
import mongoose from "mongoose";

// Interface for the BFI mapping data
export interface BfiMapping {
  questionId: string;
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
    // const exams = await Exam.find({});
    const exams = await Exam.find({
      type: ExamTypes.BFI,
    });

    const markedBfi = await SpecialExam.find({
      tag: ExamTags.BFI,
    });

    const markedBfiIds = markedBfi.map((exam: any) => exam.examId.toString());

    return {
      success: true,
      message: "Exams retrieved successfully",
      data: exams.map((exam: any) => ({
        id: exam._id.toString(),
        name: exam.name,
        description: exam.description,
        selected: markedBfiIds.includes(exam._id.toString()),
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

    // Get existing BFI mappings for this exam's questions
    const existingMappings = await Bfi.find({
      questionId: { $in: exam.questions.map((q: any) => q._id) }
    });

    // Create a map of questionId to attribute and isReversed for quick lookup
    const mappingsMap = new Map();
    existingMappings.forEach((mapping: any) => {
      mappingsMap.set(mapping.questionId.toString(), {
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
          choices: question.choices.map((choice: any) => ({
            id: choice._id.toString(),
            text: choice.text,
            isCorrect: choice.isCorrect,
          })),
          bfiAttribute: mappingsMap.get(question._id.toString())?.attribute || null,
          isReversed: mappingsMap.get(question._id.toString())?.isReversed || false,
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
        questionId: mapping.questionId,
        attribute: mapping.attribute,
        isReversed: mapping.isReversed,
      }));
      await Bfi.insertMany(bfiMappings);
    }

    await SpecialExam.findOneAndUpdate(
      { tag: ExamTags.BFI },
      { examId: data.examId },
      { upsert: true }
    );

    return { 
      success: true, 
      message: "BFI mappings saved successfully" 
    };
  } catch (error) {
    console.error("Error saving BFI mappings:", error);
    return { success: false, message: "Failed to save BFI mappings" };
  }
}