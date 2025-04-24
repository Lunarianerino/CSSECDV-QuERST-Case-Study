"use server";
//! Since this is here, consider deleting getExamById
import { connectToMongoDB } from "../db";
import { Exam, ExamAnswers, ExamStatus } from "@/models";
import { UserExamStatus } from "@/models/examStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getUserDetails from "../queries/getUserDetails";
import { AccountType } from "@/models/account";
import { getUserTypeById } from "./userActions";

//TODO: rename ExamStatus to Attempt
export interface ExamDetailsWithAnswers {
  id: string;
  name: string;
  description: string;
  attemptId?: string;
  attemptNumber?: number;
  status?: string;
  questions: {
    id: string;
    question: string;
    type: string;
    choices?: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
    points: number;
  }[];
  answers: {
    id: string;
    questionId: string;
    answers_choice?: string[];
    answer_text?: string;
    score?: number;
  }[];
}

export async function getExamByAttempt(attemptId: string): Promise<ExamDetailsWithAnswers | null> {
  try {
    await connectToMongoDB();

    //! Validate if answers work
    const examStatus = await ExamStatus.findById(attemptId).populate({
      path: "examId",
      model: "Exam",
      populate: {
        path: "questions",
        model: "Question",
        populate: {
          path: "choices",
          model: "Choice",
          select: "_id text isCorrect",
        },
      }, 
    }).populate({
      path: "answers",
      model: "ExamAnswers",
    });

    if (!examStatus) {
      throw new Error("Exam attempt not found");
    }
    console.log(examStatus.questions)
    return {
      id: attemptId,
      name: examStatus.examId.name,
      description: examStatus.examId.description,
      attemptNumber: examStatus.attemptNumber,
      status: examStatus.status,
      questions: examStatus.examId.questions.map((question: any) => ({
        id: question._id.toString(),
        question: question.question,
        type: question.type, 
        choices: question.choices.map((choice: any) => ({
          id: choice._id.toString(),
          text: choice.text,
          isCorrect: choice.isCorrect, 
        })),
        points: question.points,
      })),
      answers: examStatus.answers.map((answer: any) => ({
        id: answer._id.toString(),
        questionId: answer.questionId.toString(),
        answers_choice: answer.answers_choice.map((id: any) => id.toString()),
        answer_text: answer.answer_text, 
        score: answer.score,
      })),
    }
  } catch (error) {
    console.error("Error fetching exam:", error);
    throw new Error("Failed to fetch exam");
  }
}
// export async function getExamById(
//   examId: string,
//   attemptId?: string
// ): Promise<ExamDetailsWithAnswers | null> {
//   try {
//     await connectToMongoDB();

//     // Get the current user session
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return null;
//     }

//     const exam = await Exam.findById(examId).populate({
//       path: "questions",
//       populate: {
//         path: "choices",
//         model: "Choice",
//         select: "_id text isCorrect",
//       },
//     });

//     if (!exam) {
//       return null;
//     }

//     // Find the current active exam status for this user
//     let examStatus;
//     if (attemptId) {
//       // If an attempt ID is provided, use that specific attempt
//       examStatus = await ExamStatus.findById(attemptId);
//     } else {
//       // Otherwise, find the latest attempt that's not finished
//       examStatus = await ExamStatus.findOne({
//         userId: session.user.id,
//         examId: examId,
//         status: { $ne: UserExamStatus.FINISHED }
//       }).sort({ attemptNumber: -1 });
//     }

//     //! This might not be good since it ignores the fact that an exam might not be assigned to a user
//     if (!examStatus) {
//       throw new Error("No active exam attempt found (exam not assigned to user)");
//       // // No active attempt found
//       // return {
//       //   id: exam._id.toString(),
//       //   name: exam.name,
//       //   description: exam.description,
//       //   questions: exam.questions.map((question: any) => ({
//       //     id: question._id.toString(),
//       //     question: question.question,
//       //     type: question.type,
//       //     choices: question.choices.map((choice: any) => ({
//       //       id: choice._id.toString(),
//       //       text: choice.text,
//       //       isCorrect: choice.isCorrect,
//       //     })),
//       //   })),
//       //   answers: [],
//       // };
//     }

//     // Fetch the user's answers for this exam attempt
//     const answers = await ExamAnswers.find({
//       userId: session.user.id,
//       examId: examId,
//       _id: { $in: examStatus.answers || [] }
//     });

//     // Transform the data to a client-friendly format
//     return {
//       id: exam._id.toString(),
//       name: exam.name,
//       description: exam.description,
//       attemptId: examStatus._id.toString(),
//       attemptNumber: examStatus.attemptNumber,
//       status: examStatus.status,
//       questions: exam.questions.map((question: any) => ({
//         id: question._id.toString(),
//         question: question.question,
//         type: question.type,
//         choices: question.choices.map((choice: any) => ({
//           id: choice._id.toString(),
//           text: choice.text,
//           isCorrect: choice.isCorrect,
//         })),
//       })),
//       answers: answers.map((answer: any) => ({
//         questionId: answer.questionId.toString(),
//         choiceID: answer.choiceID ? answer.choiceID.toString() : undefined,
//         answer: answer.answer,
//       })),
//     };
//   } catch (error) {
//     console.error("Error fetching exam:", error);
//     throw new Error("Failed to fetch exam");
//   }
// }

// Add a function to save exam answers
export async function saveExamAnswerAction(
  attemptId: string,
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

    // Find the exam status for this attempt
    const examStatus = await ExamStatus.findById(attemptId);
    if (!examStatus) {
      throw new Error("Exam attempt not found");
    }

    // Check if the exam is still in progress
    if (examStatus.status === UserExamStatus.FINISHED) {
      throw new Error("Cannot modify answers for a completed exam");
    }

    // Find existing answer or create a new one
    const existingAnswer = await ExamAnswers.findOne({
      userId: session.user.id,
      examId: examStatus.examId,
      questionId: questionId,
      _id: { $in: examStatus.answers || [] }
    });

    let answer;
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
      answer = await existingAnswer.save();
    } else {
      // Create new answer
      answer = await ExamAnswers.create({
        userId: session.user.id,
        examId: examStatus.examId,
        questionId: questionId,
        answers_choice: choiceIDs || [],
        answer_text: answerText || "",
      });

      // Add the answer to the exam status
      if (!examStatus.answers) {
        examStatus.answers = [];
      }
      //! This section might not be working
      examStatus.answers.push(answer._id);
      console.log(examStatus.answers);
      await examStatus.save();
    }

    return { success: true, message: "Answer saved" };
  } catch (error) {
    console.error("Error saving answer:", error);
    throw new Error("Failed to save answer");
  }
}

/*
  This function will be called when the user starts an exam that is assigned to them.
*/
export async function setStartedExamStatusAction(attemptId: string) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
    const userId = session.user.id;
    // // Validate exam exists
    // const exam = await Exam.findById(examId);

    // if (!exam) {
    //   throw new Error("Exam not found");
    // }

    const examAttempt = await ExamStatus.findById(attemptId);

    if (!examAttempt) {
      throw new Error("Exam attempt not found");
    }

    // Verify this attempt belongs to the current user
    if (examAttempt.userId.toString() !== userId) {
      throw new Error("Not authorized to access this exam attempt");
    }

    // Only update if not already finished
    if (examAttempt.status !== UserExamStatus.FINISHED) {
      examAttempt.status = UserExamStatus.STARTED;
      await examAttempt.save();
    } else {
      return {
        success: false,
        message: "Cannot start a finished exam.",
      };
    }

    return {
      success: true,
      message: "Exam status updated successfully.",
      attemptId: examAttempt._id.toString(),
    };
  } catch (error) {
    console.error("Error saving exam status:", error);
    throw new Error("Failed to save exam status");
  }
}

export async function setFinishedExamStatusAction(attemptId: string) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions); 
    if (!session) {
      throw new Error("Not authenticated"); 
    }
    const userId = session.user.id;

    const examAttempt = await ExamStatus.findById(attemptId);

    if (!examAttempt) {
      throw new Error("Exam attempt not found");
    }

    // Verify this attempt belongs to the current user
    if (examAttempt.userId.toString() !== userId) {
      throw new Error("Not authorized to access this exam attempt");
    }

    examAttempt.status = UserExamStatus.FINISHED;
    examAttempt.completedAt = new Date();
    await examAttempt.save();  

    return {
      success: true,
      message: "Exam status updated successfully.",
      attemptId: examAttempt._id.toString(),
    };

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
  asigneeId: string
) {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    // get session role and userId role
    const sessionType = session.user.type;
    const asigneeType = await getUserTypeById(asigneeId);

    if (!(sessionType === AccountType.ADMIN)) {
      if (
        !(
          sessionType === AccountType.TUTOR &&
          asigneeType === AccountType.STUDENT
        )
      ) {
        throw new Error(
          `This user cannot assign exams to a user that is an ${asigneeType}.`
        );
      }
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);

    if (!exam) {
      throw new Error("Exam not found");
    }

    // Find the latest attempt for this user and exam
    const latestAttempt = await ExamStatus.findOne({
      userId: asigneeId,
      examId: examId,
    }).sort({ attemptNumber: -1 });

    // Calculate the next attempt number
    const nextAttemptNumber = latestAttempt ? latestAttempt.attemptNumber + 1 : 1;

    // Create a new exam status entry for this attempt
    const newAttempt = await ExamStatus.create({
      userId: asigneeId,
      examId: examId,
      assignedBy: session.user.id,
      status: UserExamStatus.NOT_STARTED,
      attemptNumber: nextAttemptNumber,
    });

    console.log(newAttempt);
    return {
      success: true,
      message: "Exam assigned successfully.",
      attemptId: newAttempt._id.toString(),
      attemptNumber: nextAttemptNumber,
    };
  } catch (error) {
    console.error("Error saving exam status:", error);
    throw new Error("Failed to save exam status");
  }
}

export interface ExamListItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  graded: boolean;
}
/*
 Action to get exams where admins get all exams and tutors get only exams that they created.
*/
//TODO: add pagination, search, and sorting
export async function getExams(): Promise<ExamListItem[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    const sessionType = session.user.type;

    if (
      sessionType !== AccountType.ADMIN &&
      sessionType !== AccountType.TUTOR
    ) {
      throw new Error("Not authorized");
    }

    const filter =
      sessionType === AccountType.ADMIN ? {} : { createdBy: session.user.id };

    const exams = await Exam.find(filter);

    return exams.map((exam) => ({
      id: exam._id.toString(),
      name: exam.name,
      description: exam.description,
      required: exam.required,
      graded: exam.graded,
    }));
  } catch (error) {
    console.error("Error fetching exams:", error);
    throw new Error("Failed to fetch exams");
  }
}

/*
  Action to get users that have been assigned to do the exam.
  For admins, this will return all users that have been assigned to do the exam.
  For tutors, this will return only users that have been assigned to do the exam by the tutor.
  TODO: add a filter that would only return users that are currently paired with the tutor.
*/
export async function getAssignedUsers(examId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
    const exam = await Exam.findById(examId);
  
    if (!exam) {
      throw new Error("Exam not found");
    }
  
    // if not creator but not admin, throw error; admins are able to view all
    if (
      exam.createdBy !== session.user.id &&
      session.user.type !== AccountType.ADMIN
    ) {
      throw new Error("You are not authorized to assign users to this exam");
    }
  
    const assignedUsers = await ExamStatus.find({ examId: examId });
  
    return assignedUsers;
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    throw new Error("Failed to fetch assigned users"); 
  }

}

export async function getAssignedExams() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
  
    // Get all exam attempts for this user, grouped by exam
    const examAttempts = await ExamStatus.find({ 
      userId: session.user.id 
    }).populate({
      path: "examId",
      model: "Exam",
    }).sort({ attemptNumber: -1 });
    
    // Group attempts by exam ID to show the latest attempt first
    const examMap = new Map();
    
    for (const attempt of examAttempts) {
      const examId = attempt.examId._id.toString();
      
      if (!examMap.has(examId)) {
        examMap.set(examId, {
          exam: attempt.examId,
          attempts: [],
        });
      }
      
      examMap.get(examId).attempts.push({
        attemptId: attempt._id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        completedAt: attempt.completedAt,
      });
    }
    
    // Convert map to array
    const result = Array.from(examMap.values());
    
    return result;
  } catch (error) {
    console.error("Error fetching assigned exams:", error);
    throw new Error("Failed to fetch assigned exams");
  }
}

export async function autoAssignExams() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }
  
    const userType = await getUserTypeById(session.user.id);
    let filter = {};
  
    if (userType === AccountType.STUDENT) {
      filter = { forStudents: true };
    } else if (userType === AccountType.TUTOR) {
      filter = { forTutors: true };
    }
  
    const exams = await Exam.find(filter);
  
    for (const exam of exams) {
      const existingUserExam = await ExamStatus.findOne({
        userId: session.user.id,
        examId: exam._id,
      });
  
      if (existingUserExam) {
        continue;
      }
      await ExamStatus.create({
        userId: session.user.id,
        examId: exam._id,
      });
    }
  
    return {
      success: true,
      message: "Exams assigned successfully.", 
    };    
  } catch (error) {
    console.error("Error auto-assigning exams:", error);
    throw new Error("Failed to auto-assign exams"); 
  }
}
