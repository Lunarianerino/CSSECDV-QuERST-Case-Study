"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

import {
  Exam,
  Question,
  Choice,
  Bfi,
  SpecialExam,
  ExamStatus,
  Account,
} from "@/models";
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
      path: "questions",
      model: "Question",
      populate: {
        path: "choices",
        model: "Choice",
      },
    });

    if (!exam) {
      return { success: false, message: "Exam not found", data: null };
    }

    // Get existing BFI mappings for this exam's questions
    const existingMappings = await Bfi.find({
      questionId: { $in: exam.questions.map((q: any) => q._id) },
    });

    // Create a map of questionId to attribute and isReversed for quick lookup
    const mappingsMap = new Map();
    existingMappings.forEach((mapping: any) => {
      mappingsMap.set(mapping.questionId.toString(), {
        attribute: mapping.attribute,
        isReversed: mapping.isReversed,
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
          bfiAttribute:
            mappingsMap.get(question._id.toString())?.attribute || null,
          isReversed:
            mappingsMap.get(question._id.toString())?.isReversed || false,
        })),
      },
    };
  } catch (error) {
    console.error("Error retrieving exam details:", error);
    return {
      success: false,
      message: "Failed to retrieve exam details",
      data: null,
    };
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
      const bfiMappings = data.mappings.map((mapping) => ({
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
      message: "BFI mappings saved successfully",
    };
  } catch (error) {
    console.error("Error saving BFI mappings:", error);
    return { success: false, message: "Failed to save BFI mappings" };
  }
}

export interface BfiResult {
  [BFIAttributes.O]: number;
  [BFIAttributes.C]: number;
  [BFIAttributes.E]: number;
  [BFIAttributes.A]: number;
  [BFIAttributes.N]: number;
}

export interface BfiResultResponse {
  success: boolean;
  message: string;
  data: BfiResult | null;
}
export async function getBfiResultsAction(
  userId: string
): Promise<BfiResultResponse> {
  try {
    const bfiResults = {
      [BFIAttributes.O]: 0,
      [BFIAttributes.C]: 0,
      [BFIAttributes.E]: 0,
      [BFIAttributes.A]: 0,
      [BFIAttributes.N]: 0,
    };

    const bfiQuestionCount = {
      [BFIAttributes.O]: 0,
      [BFIAttributes.C]: 0,
      [BFIAttributes.E]: 0,
      [BFIAttributes.A]: 0,
      [BFIAttributes.N]: 0,
    };

    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to access user data");
    }

    // Get user details
    const user = await Account.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    // The way to calculate the BFI results is to sum up the scores of all the questions
    // that are mapped to the BFI attribute.
    // The score is the first character of the choice that is selected.
    // If the choice is reversed, the score is the inverse character of the choice that is selected. (e.g. 1 for 5, 5 for 1) so its 6 - score.
    // The score is then added to the BFI attribute then divided by the number of questions corresponding to that attribute.
    // Get the BFI mappings
    const bfiMappings = await Bfi.find({});
    if (!bfiMappings) {
      return { success: false, message: "BFI mappings not found", data: null };
    }
    // Get the answers for the user
    const bfiExam = await SpecialExam.findOne({ tag: ExamTags.BFI }).populate({
      path: "examId",
      model: "Exam",
      populate: {
        path: "questions",
        model: "Question",
      },
    });
    if (!bfiExam) {
      return { success: false, message: "BFI exam not found", data: null };
    }

    const bfiQuestions = bfiExam.examId.questions;
    if (!bfiQuestions) {
      return { success: false, message: "BFI questions not found", data: null };
    }

    const bfiQuestionIds = bfiQuestions.map((question: any) =>
      question._id.toString()
    );

    const userExam = await ExamStatus.find({
      userId: userId,
      examId: bfiExam.examId._id,
    })
      .populate({
        path: "answers",
        model: "ExamAnswers",
        populate: {
          path: "answers_choice",
          model: "Choice",
        },
      })
      .sort({ attemptNumber: -1 })
      .limit(1);
    if (!userExam) {
      return { success: false, message: "User exam not found", data: null };
    }

    // console.log(userExam[0].answers);

    userExam[0].answers.forEach((answer: any) => {
      if (bfiQuestionIds.includes(answer.questionId.toString())) {
        const bfiMapping = bfiMappings.find(
          (mapping: any) =>
            mapping.questionId.toString() === answer.questionId.toString()
        );
        if (!bfiMapping) {
          return;
        }
        // This is pretty safe since only one choice can be selected for each question.
        const answerText = answer.answers_choice[0].text;
        let answerScore = 0;
        try {
          answerScore = parseInt(answerText[0]);
        } catch (error) {
          return;
        }
        if (bfiMapping.isReversed) {
          answerScore = 6 - answerScore;
        }
        bfiResults[bfiMapping.attribute] += answerScore;
        bfiQuestionCount[bfiMapping.attribute] += 1;
      }
    });

    // Calculate the average score for each BFI attribute
    for (const attribute in bfiResults) {
      if (bfiQuestionCount[attribute as BFIAttributes] > 0) {
        bfiResults[attribute as BFIAttributes] /= bfiQuestionCount[attribute as BFIAttributes];
      }
    }

    return {
      success: true,
      message: "BFI results retrieved successfully",
      data: bfiResults,
    };
  } catch (error) {
    console.error("Error getting BFI results:", error);
    return { success: false, message: "Failed to get BFI results", data: null };
  }
}
