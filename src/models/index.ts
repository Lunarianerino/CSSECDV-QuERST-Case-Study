import mongoose from "mongoose";
import { AccountSchema, IAccount } from "./account";
import { ChoiceSchema, IChoice } from "./choice";
import { ExamSchema, IExam } from "./exam";
import { ExamAnswersSchema, IExamAnswers } from "./examAnswers";
import { ExamStatusSchema } from "./examStatus";
import { MatchSchema, IMatch } from "./match";
import { QuestionSchema, IQuestion } from "./question";
import { ScheduleSchema, ISchedule } from "./schedule";
import { VarkSchema, IVark } from "./vark";
import { BfiSchema, IBfi } from "./bfi";
import { SpecialExamSchema, ISpecialExam } from "./specialExam";
import { ProgramSchema, IProgram } from "./program";

// Initialize all models in one place to prevent duplicate model errors
export const Account = mongoose.models?.Account || mongoose.model<IAccount>("Account", AccountSchema);
export const Choice = mongoose.models?.Choice || mongoose.model<IChoice>("Choice", ChoiceSchema);
export const Exam = mongoose.models?.Exam || mongoose.model<IExam>("Exam", ExamSchema);
export const ExamAnswers = mongoose.models?.ExamAnswers || mongoose.model<IExamAnswers>("ExamAnswers", ExamAnswersSchema);
export const ExamStatus = mongoose.models?.ExamStatus || mongoose.model("ExamStatus", ExamStatusSchema);
export const Match = mongoose.models?.Match || mongoose.model<IMatch>("Match", MatchSchema);
export const Question = mongoose.models?.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
export const Schedule = mongoose.models?.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);
export const Vark = mongoose.models?.Vark || mongoose.model<IVark>("Vark", VarkSchema);
export const Bfi = mongoose.models?.Bfi || mongoose.model<IBfi>("Bfi", BfiSchema);
export const SpecialExam = mongoose.models?.SpecialExam || mongoose.model<ISpecialExam>("SpecialExam", SpecialExamSchema);
export const Program = mongoose.models?.Program || mongoose.model<IProgram>("Program", ProgramSchema);

// Export all models
export default {
  Account,
  Choice,
  Exam,
  ExamAnswers,
  ExamStatus,
  Match,
  Question,
  Schedule,
  Vark,
  Bfi,
  SpecialExam,
  Program
};