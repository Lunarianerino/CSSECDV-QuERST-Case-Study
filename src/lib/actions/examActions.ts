"use server";
//! Since this is here, consider deleting getExamById
import { connectToMongoDB } from "../db";
import { Exam, ExamAnswers, ExamStatus } from "@/models";
import { UserExamStatus } from "@/models/examStatus"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getUserDetails from "../queries/getUserDetails";
import { AccountType } from "@/models/account";

export interface ExamDetailsWithAnswers {
  id: string;
  name: string;
  description: string;
  questions: {
    id: string;
    question: string;
    type: string;
    choices?: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  }[];
  answers: {
    questionId: string;
    choiceID?: string;
    answer?: string;
  }[];
}

export async function getExamByIdAction(examId: string): Promise<ExamDetailsWithAnswers | null> {
  try {
    await connectToMongoDB();
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return null;
    }
    
    const exam = await Exam.findById(examId)
      .populate({
        path: 'questions',
        populate: {
          path: 'choices',
          model: 'Choice',
          select: '_id text isCorrect',
        }
      });
      
    if (!exam) {
      return null;
    }
    
    // Fetch the user's answers for this exam
    const answers = await ExamAnswers.find({ 
      userId: session.user.id, 
      examId: examId 
    });
    
    // Transform the data to a client-friendly format
    return {
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
        }))
      })),
      answers: answers.map((answer: any) => ({
        questionId: answer.questionId.toString(),
        choiceID: answer.choiceID ? answer.choiceID.toString() : undefined,
        answer: answer.answer,
      }))
    };
  } catch (error) {
    console.error("Error fetching exam:", error);
    throw new Error("Failed to fetch exam");
  }
}

// Add a function to save exam answers
export async function saveExamAnswerAction(
  examId: string, 
  questionId: string, 
  choiceIDs?: string[], // Changed to array to support multiple choices
  answerText?: string
) {
  try {
    await connectToMongoDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
    
    // Find existing answer or create a new one
    const existingAnswer = await ExamAnswers.findOne({
      userId: session.user.id,
      examId: examId,
      questionId: questionId
    });
    
    if (existingAnswer) {
      // Update existing answer
      if (choiceIDs && choiceIDs.length > 0) {
        // For choice-based answers, update the answers_choice array
        existingAnswer.answers_choice = choiceIDs;
      }
      if (answerText) {
        // For text-based answers, update the answer_text field
        existingAnswer.answer_text = answerText;
      }
      await existingAnswer.save();
      return { success: true, message: "Answer updated" };
    } else {
      // Create new answer
      await ExamAnswers.create({
        userId: session.user.id,
        examId: examId,
        questionId: questionId,
        answers_choice: choiceIDs || [],
        answer_text: answerText || ""
      });
      return { success: true, message: "Answer saved" };
    }
  } catch (error) {
    console.error("Error saving answer:", error);
    throw new Error("Failed to save answer");
  }
}

/*
  This function will be called when the user starts an exam that is assigned to them.
*/
export async function setStartedExamStatusAction(
  examId: string,
) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
    const userId = session.user.id;
    // Validate exam exists
    const exam = await Exam.findById(examId);

    if (!exam) {
      throw new Error("Exam not found");
    }

    const existingUserExam = await ExamStatus.findOne({
      userId: userId,
      examId: examId,
    });

    if (existingUserExam) {
      existingUserExam.status = UserExamStatus.STARTED;
      await existingUserExam.save();
    } else {
      return {
        success: false,
        message: "Exam not assigned to user.",
      }
    }

    return {
      success: true,
      message: "Exam status updated successfully.",
    }
  } catch (error) {
    console.error("Error saving exam status:", error);
    throw new Error("Failed to save exam status"); 
  }
}

/*
  This function will be called when a higher level user assigns an exam to a user (e.g. admin to teachers and students or teacher to student).
*/
export async function assignExamToUserAction(
  examId: string,
  asigneeId: string, 
) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions); 
    if (!session) {
      throw new Error("Not authenticated"); 
    }
    
    // get session role and userId role
    const sessionType = (await getUserDetails(session.user.email)).type;
    const asigneeType = (await getUserDetails(asigneeId)).type;

    if (!(sessionType === AccountType.ADMIN)) {
      if (!(sessionType === AccountType.TUTOR && asigneeType === AccountType.STUDENT)) {
        throw new Error(`This user cannot assign exams to a user that is an ${asigneeType}.`); 
      }
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);

    if (!exam) {
      throw new Error("Exam not found");
    }

    const existingUserExam = await ExamStatus.findOne({
      userId: asigneeId,
      examId: examId,
    });

    if (existingUserExam) {
      return {
        success: false,
        message: "Exam already assigned to user.",
      }  
    }
    
    await ExamStatus.create({
      userId: asigneeId,
      examId: examId,
      status: UserExamStatus.NOT_STARTED,
    });

    return {
      success: true,
      message: "Exam assigned successfully.",
    }
  } catch (error) {
    console.error("Error saving exam status:", error);
    throw new Error("Failed to save exam status");
  }
}