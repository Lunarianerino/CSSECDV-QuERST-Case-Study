import mongoose, { Schema, Document, Types } from "mongoose";

// Specific exams that would be used for the profile
export enum ExamTags {
  VARK = "VARK",
  BFI = "BFI",
}
export interface ISpecialExam {
  examId: Types.ObjectId;
  tag: ExamTags;
}

export const SpecialExamSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    tag: { type: String, enum: ExamTags, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);