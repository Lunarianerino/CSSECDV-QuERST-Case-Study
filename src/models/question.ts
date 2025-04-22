// Exam Questions
import mongoose, { Schema, Document, Types } from "mongoose";
export interface IQuestion extends Document {
  question: string;
  type: string;
  choices?: Types.ObjectId[];
  points: number;
}

export const QuestionSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    type: { type: String, required: true, enum: ['choice', 'multiple_choice', 'text'] },
    choices: [{ type: Schema.Types.ObjectId, required: true, ref: 'Choice' }],
    points: { type: Number, required: true, default: 1 },
  },
  {
    timestamps: true,
  }
);