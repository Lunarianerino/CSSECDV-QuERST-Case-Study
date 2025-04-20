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

export async function getExamById(
  examId: string
): Promise<ExamDetailsWithAnswers | null> {
  try {
    await connectToMongoDB();

    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return null;
    }

    const exam = await Exam.findById(examId).populate({
      path: "questions",
      populate: {
        path: "choices",
        model: "Choice",
        select: "_id text isCorrect",
      },
    });

    if (!exam) {
      return null;
    }

    // Fetch the user's answers for this exam
    const answers = await ExamAnswers.find({
      userId: session.user.id,
      examId: examId,
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
        })),
      })),
      answers: answers.map((answer: any) => ({
        questionId: answer.questionId.toString(),
        choiceID: answer.choiceID ? answer.choiceID.toString() : undefined,
        answer: answer.answer,
      })),
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
      questionId: questionId,
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
        answer_text: answerText || "",
      });
      console.log("Answer saved");
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
export async function setStartedExamStatusAction(examId: string) {
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
      };
    }

    return {
      success: true,
      message: "Exam status updated successfully.",
    };
  } catch (error) {
    console.error("Error saving exam status:", error);
    throw new Error("Failed to save exam status");
  }
}

export async function setFinishedExamStatusAction(examId: string) {
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
      existingUserExam.status = UserExamStatus.FINISHED;
      await existingUserExam.save();  
    } else {
      return {
        success: false,
        message: "Exam not assigned to user.",
      };
    }

    return {
      success: true,
      message: "Exam status updated successfully.",
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

    const existingUserExam = await ExamStatus.findOne({
      userId: asigneeId,
      examId: examId,
    });

    if (existingUserExam) {
      return {
        success: false,
        message: "Exam already assigned to user.",
      };
    }

    await ExamStatus.create({
      userId: asigneeId,
      examId: examId,
      status: UserExamStatus.NOT_STARTED,
    });

    return {
      success: true,
      message: "Exam assigned successfully.",
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
  
    //? does this work?
    const exams = await ExamStatus.find({ userId: session.user.id }).populate({
      path: "examId",
      model: "Exam",
    });
  
    // combine the two arrays
    console.log(exams);
    return exams;
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
