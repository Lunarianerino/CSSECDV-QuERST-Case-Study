import mongoose, { Schema, Document, Types } from "mongoose";

interface ExamStatus extends Document {
  examId: Types.ObjectId;
  userId: Types.ObjectId;
  status: string;
  score?: number;
  answers?: Types.ObjectId[];
  completedAt?: Date;
}

export const ExamStatusSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, required: true, ref: 'Exam' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
    status: { type: String, required: true, default: 'incomplete' },
    score: { type: Number, required: false },
    answers: [{ type: Schema.Types.ObjectId, required: false }], 
    completedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
)