import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChoice extends Document {
  text: string;
  isCorrect: boolean;
}

const ChoiceSchema: Schema = new Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false }, 
  } 
)

const Choice = mongoose.models.Choice || mongoose.model<IChoice>("Choice", ChoiceSchema);
export default Choice;