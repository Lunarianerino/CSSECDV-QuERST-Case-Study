import mongoose, { Schema, Document, Types } from "mongoose";
export interface IExamAnswers {
  examId: Types.ObjectId;
  questionId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: Types.ObjectId[];
  attemptId?: Types.ObjectId;
  answers_choice?: Types.ObjectId[];
  answer_text?: string;
  score?: number;
}

export const ExamAnswersSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, required: true, ref: 'Exam' },
    questionId: { type: Schema.Types.ObjectId, required: true, ref: 'Question' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
    attemptId: { type: Schema.Types.ObjectId, required: false, ref: 'ExamStatus' },
    answers_choice: [{ type: Schema.Types.ObjectId, required: true, ref: 'Choice' }],
    answer_text: { type: String, required: false },
    score: { type: Number, required: false },
  }, 
)