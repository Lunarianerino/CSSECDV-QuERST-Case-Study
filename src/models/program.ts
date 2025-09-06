// Models for a Tutoring Program Feature (e.g. SVT 2025)
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProgram extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    participants: Types.Array<Types.ObjectId>;
    pairings: Types.Array<{ tutor: Types.ObjectId; student: Types.ObjectId }>;
}

export const ProgramSchema = new Schema<IProgram>({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [{ type: Types.ObjectId, ref: "Account" }],
    pairings: [{ tutor: { type: Types.ObjectId, ref: "Account" }, student: { type: Types.ObjectId, ref: "Account" } }]
});