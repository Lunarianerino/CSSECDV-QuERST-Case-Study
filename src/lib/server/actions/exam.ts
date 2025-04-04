"use server";
import { ExamFormValues } from "@/lib/validations/exams"
import { connectToMongoDB } from "@/lib/db"
import { Exam, Question, Choice } from "@/models"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth";
export const createExam = async (values: ExamFormValues) => {
  try {
    const session = await getServerSession(authOptions);
    console.log(session);
    if (!session || session.user?.type !== "admin") {
      return { 
        success: false, 
        error: "Unauthorized", 
        status: 401 
      }
    }
    await connectToMongoDB()

    // Build the exam down to top
    const question_ids = await Promise.all(values.questions.map(async (question) => {
      const newQuestion = new Question({
        question: question.question,
        type: question.type,
      });

      if (question.type === "choice") {
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
        console.log(newQuestion.choices);
        console.log("Choices saved");
      }

      console.log(newQuestion);
      const question_result = await newQuestion.save();
      console.log("Question saved");
      console.log(question_result);
      return question_result._id;
    }));

    const exam = new Exam({
      name: values.name,
      description: values.description,
      questions: question_ids,
      required: values.required,
      graded: values.graded,
    });

    const exam_result = await exam.save();
    console.log("Exam saved");
    console.log(exam_result);
    return {
      success: true,
      status: 200,
    } 
  } catch (error) {
    console.log(error)
    return { 
      success: false, 
      error: "Internal Server Error", 
      status: 500 
    }
  }
}