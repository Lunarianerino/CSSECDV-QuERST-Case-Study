/*
  This model assigns BFI attributes to questions instead of answers
*/

import mongoose, { Schema, Document, Types } from "mongoose";

export enum BFIAttributes {
  E = "Extroversion",
  N = "Neuroticism",
  A = "Agreeableness",
  C = "Conscientiousness",
  O = "Openness",
};

export interface IBfi extends Document {
  questionId: Types.ObjectId;
  attribute: string;
  isReversed: boolean;
};

export const BfiSchema: Schema = new Schema ({
  questionId: { type: Schema.Types.ObjectId, ref: "Question" },
  attribute: { type: String, enum: BFIAttributes },
  isReversed: { type: Boolean, default: false },
});