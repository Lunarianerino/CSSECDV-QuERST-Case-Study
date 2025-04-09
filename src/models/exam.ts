// Exams
import mongoose, { Schema, Document, Types } from "mongoose";
export interface IExam extends Document {
  name: string;
  description: string;
  questions: Types.ObjectId[];
  required: boolean;
  graded: boolean;
  createdBy: Types.ObjectId;
}

export const ExamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    required: { type: Boolean, required: true, default: false },
    graded: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  {
    timestamps: true,
  }
);