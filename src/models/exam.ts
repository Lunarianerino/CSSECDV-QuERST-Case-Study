// Exams
import mongoose, { Schema, Document, Types } from "mongoose";

export enum ExamTypes {
  SUMMATIVE = "SUMMATIVE",
  FORMATIVE = "FORMATIVE",
  SURVEY = "SURVEY",
  BFI = "BFI",
  VARK = "VARK",
  OTHERS = "OTHERS",
  DOMAIN = "DOMAIN",
}
export interface IExam extends Document {
  name: string;
  description: string;
  questions: Types.ObjectId[];
  required: boolean;
  graded: boolean;
  createdBy: Types.ObjectId;
  forStudents: boolean;
  forTutors: boolean;
  type: ExamTypes;
  maxScore: number;
}

export const ExamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    required: { type: Boolean, required: true, default: false },
    graded: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "Account" },
    forStudents: { type: Boolean, required: true, default: false },
    forTutors: { type: Boolean, required: true, default: false },
    type: { type: String, enum: ExamTypes, required: true, default: ExamTypes.OTHERS },
    maxScore: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);