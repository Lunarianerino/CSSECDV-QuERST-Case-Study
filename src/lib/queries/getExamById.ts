import { Exam, Question, Choice, ExamAnswers } from "@/models";
import { connectToMongoDB } from "@/lib/db";
import getUserDetails from "./getUserDetails";
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth";
export interface ExamDetails {
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
export default async function getExamById(examId: string): Promise<ExamDetails | null> {
  await connectToMongoDB();
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

  const answers = await ExamAnswers.find({ userId: session.user.id, examId: examId });

  const examDetails: ExamDetails = {
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
  }

  return examDetails;
}