import mongoose, { Schema, Document, Types } from "mongoose";
export enum MatchStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// export enum Subjects {
//   MATH = "math",
//   SCIENCE = "science",
//   ENGLISH = "english",
// }

export interface IMatch extends Document {
  studentId: Types.ObjectId;
  tutorId: Types.ObjectId;
  status: string;
  reason?: string;
  subject: string;
  //TODO: consider adding timestamps
}

export const MatchSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
    tutorId: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
    status: { type: String, required: true, default: MatchStatus.PENDING, enum: MatchStatus }, 
    reason: { type: String, required: false },
    subject: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

