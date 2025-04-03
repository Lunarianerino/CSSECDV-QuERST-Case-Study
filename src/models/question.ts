// Exam Questions
import mongoose, { Schema, Document, Types } from "mongoose";
export interface IQuestion extends Document {
  question: string;
  type: string;
  choices?: Types.ObjectId[];
}

const QuestionSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    type: { type: String, required: true },
    choices: [{ type: Types.ObjectId, required: true, enum: ['choice', 'text'] }],
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
export default Question;