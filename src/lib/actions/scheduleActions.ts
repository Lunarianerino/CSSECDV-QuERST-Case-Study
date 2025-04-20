"use server";
import { connectToMongoDB } from "../db";
import { Schedule } from "@/models";
import { WeeklySchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

/**
 * Get the schedule for the current authenticated user
 */
export async function getScheduleAction() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Not authenticated", data: null };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Find the schedule for the current user and populate assignment references
    const userSchedule = await Schedule.findOne({ userId: session.user.id })
      .populate({
        path: 'schedule.monday.intervals.assignment schedule.tuesday.intervals.assignment schedule.wednesday.intervals.assignment schedule.thursday.intervals.assignment schedule.friday.intervals.assignment schedule.saturday.intervals.assignment schedule.sunday.intervals.assignment',
        model: 'Account',
        select: 'name email type' // Only select necessary fields
      })
      .lean() as {
        schedule: WeeklySchedule;
      } | null;

    if (!userSchedule) {
      return { success: true, message: "No schedule found", data: null };
    }

    // Convert to plain JavaScript object to remove any circular references
    const scheduleData = JSON.parse(JSON.stringify(userSchedule.schedule));
    return { success: true, message: "Schedule retrieved successfully", data: scheduleData };
  } catch (error) {
    console.error("Error retrieving schedule:", error);
    return { success: false, message: "Failed to retrieve schedule", data: null };
  }
}

/**
 * Create or update the schedule for the current authenticated user
 */
export async function createOrUpdateScheduleAction(schedule: WeeklySchedule) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Find the existing schedule or create a new one
    const existingSchedule = await Schedule.findOne({ userId: session.user.id });

    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.schedule = schedule;
      await existingSchedule.save();
      return { success: true, message: "Schedule updated successfully" };
    } else {
      // Create new schedule
      await Schedule.create({
        userId: new Types.ObjectId(session.user.id),
        schedule: schedule
      });
      return { success: true, message: "Schedule created successfully" };
    }
  } catch (error) {
    console.error("Error saving schedule:", error);
    return { success: false, message: "Failed to save schedule" };
  }
}

/**
 * Delete the schedule for the current authenticated user
 */
export async function deleteScheduleAction() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Delete the schedule
    const result = await Schedule.deleteOne({ userId: session.user.id });

    if (result.deletedCount === 0) {
      return { success: false, message: "No schedule found to delete" };
    }

    return { success: true, message: "Schedule deleted successfully" };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, message: "Failed to delete schedule" };
  }
}

