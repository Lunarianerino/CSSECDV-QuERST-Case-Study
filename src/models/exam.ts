// Exams
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExam extends Document {
  name: string;
  description: string;
  questions: Types.ObjectId[];
  required: boolean;
  graded: boolean;
}

const ExamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{ type: Types.ObjectId, required: true }],
    required: { type: Boolean, required: true, default: false },
    graded: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);
export default Exam;