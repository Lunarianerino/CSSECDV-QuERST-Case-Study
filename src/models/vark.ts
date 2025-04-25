/*
  This model would assign answers to VARK attributes
*/

import mongoose, { Schema, Document, Types } from "mongoose";

export enum VARKAttributes {
  V = "Visual",
  A = "Auditory",
  R = "Read/Write",
  K = "Kinesthetic",
};

export interface IVark extends Document {
  answerId: Types.ObjectId;
  attribute: string;
};

export const VarkSchema: Schema = new Schema ({
  answerId: { type: Schema.Types.ObjectId, ref: "Answer" },
  attribute: { type: String, enum: VARKAttributes },
});