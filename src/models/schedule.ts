/*
 Schedule Schema for tutors and students
*/

import mongoose, {Schema, Document, Types } from "mongoose";
import { WeeklySchedule } from "@/types/schedule";
export interface ISchedule extends Document {
  userId: Types.ObjectId;
  schedule: WeeklySchedule;
}

const TimeIntervalSchema = new Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
  assignment: { type: Schema.Types.ObjectId, required: false, ref: "Account" }
}, { _id: false });

const DayScheduleSchema = new Schema({
  intervals: { type: [TimeIntervalSchema], default: [] }
}, { _id: false });5

const WeeklyScheduleSchema = new Schema({
  monday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  tuesday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  wednesday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  thursday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  friday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  saturday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) },
  sunday: { type: DayScheduleSchema, required: true, default: () => ({ intervals: [] }) }
}, { _id: false });

export const ScheduleSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "Account"},
  schedule: { type: WeeklyScheduleSchema, required: true }
}, {
  timestamps: true
})