"use server";
import { ExamFormValues } from "@/lib/validations/exams"
import { connectToMongoDB } from "@/lib/db"
import { Exam, Question, Choice } from "@/models"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";
// Note: No database schema changes needed as the existing text fields
// can store markdown content without modification
export const createExam = async (values: ExamFormValues) => {
  try {
    const session = await getServerSession(authOptions);
    // console.log(session);

    //TODO: tutors and admins can create exams
    if (!session || session.user?.type === AccountType.STUDENT || session.user?.type === AccountType.UNKNOWN) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: session?.user?.id,
        resource: "createExam",
        message: "Unauthorized access",
      });
      return { 
        success: false, 
        error: "Unauthorized", 
        status: 401 
      }
    }
    await connectToMongoDB()

    // Build the exam down to top
    let maxScore = 0;
    const question_ids = await Promise.all(values.questions.map(async (question) => {
      maxScore += question.points ? question.points : 0;

      const newQuestion = new Question({
        question: question.question,
        type: question.type,
        points: question.points? question.points : 0,
      });

      if (question.type === "choice" || question.type === "multiple_choice") {
        if (!question.choices) {
          return { 
            success: false, 
            error: "Missing choices", 
            status: 400 
          }
        }
        const choices = question.choices.map((choice) => {
          return new Choice({
            text: choice.text,
            isCorrect: choice.isCorrect,
          });
        });
        const choice_result = await Choice.insertMany(choices);
        newQuestion.choices = choice_result.map((result) => result._id);
        // console.log(newQuestion.choices);
        // console.log("Choices saved");
      }

      // console.log(newQuestion);
      const question_result = await newQuestion.save();
      // console.log("Question saved");
      // console.log(question_result);
      return question_result._id;
    }));
    const exam = new Exam({
      name: values.name,
      description: values.description,
      questions: question_ids,
      required: values.required,
      graded: values.graded,
      createdBy: session.user.id,
      type: values.type,
      maxScore: maxScore,
    });

    const exam_result = await exam.save();
    // console.log("Exam saved");
    // console.log(exam_result);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_CREATE,
      outcome: "success",
      userId: session.user.id,
      resource: "createExam",
      message: `Created exam ${exam_result._id.toString()}`,
    });
    return {
      success: true,
      status: 200,
    } 
  } catch (error) {
    // console.log(error)
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_CREATE,
      outcome: "failure",
      resource: "createExam",
      message: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "Internal Server Error", 
      status: 500 
    }
  }
}
