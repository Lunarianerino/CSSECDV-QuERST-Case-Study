/*
  This model would assign answers to VARK attributes
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
  answerId: Types.ObjectId;
  attribute: string;
  isReversed: boolean;
};

export const BfiSchema: Schema = new Schema ({
  answerId: { type: Schema.Types.ObjectId, ref: "Answer" },
  attribute: { type: String, enum: BFIAttributes },
  isReversed: { type: Boolean, default: false },
});