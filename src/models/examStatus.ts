import mongoose, { Schema, Document, Types } from "mongoose";
export enum UserExamStatus {
  NOT_STARTED = 'not started',
  STARTED = 'started',
  FINISHED = 'finished', 
}
export interface IExamStatus extends Document {
  examId: Types.ObjectId;
  userId: Types.ObjectId;
  status: string;
  score?: number;
  answers?: Types.ObjectId[];
  completedAt?: Date;
  attemptNumber?: number;
}

//TODO: consider changing name of this schema
export const ExamStatusSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, required: true, ref: 'Exam' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
    status: { type: String, required: true, default: UserExamStatus.NOT_STARTED, enum: UserExamStatus },
    score: { type: Number, required: false },
    answers: [{ type: Schema.Types.ObjectId, required: false, ref: 'ExamAnswer' }], 
    completedAt: { type: Date, required: false },
    attemptNumber: { type: Number, required: true, default: 1 },
  },
  {
    timestamps: true,
  }
)