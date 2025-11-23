"use server";
import { connectToMongoDB } from "../db";
import { Schedule } from "@/models";
import { WeeklySchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { logSecurityEvent } from "../securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

/**
 * Get the schedule for the current authenticated user
 */
export async function getScheduleAction() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "getScheduleAction",
        message: "Not authenticated",
      });
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
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_READ,
        outcome: "success",
        userId: session.user?.id,
        resource: "getScheduleAction",
        message: "No schedule found",
      });
      return { success: true, message: "No schedule found", data: null };
    }

    // Convert to plain JavaScript object to remove any circular references
    const scheduleData = JSON.parse(JSON.stringify(userSchedule.schedule));
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "success",
      userId: session.user?.id,
      resource: "getScheduleAction",
      message: "Schedule retrieved",
    });
    return { success: true, message: "Schedule retrieved successfully", data: scheduleData };
  } catch (error) {
    console.error("Error retrieving schedule:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "failure",
      resource: "getScheduleAction",
      message: error instanceof Error ? error.message : String(error),
    });
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
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "createOrUpdateScheduleAction",
        message: "Not authenticated",
      });
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
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_UPDATE,
        outcome: "success",
        userId: session.user?.id,
        resource: "createOrUpdateScheduleAction",
        message: "Schedule updated",
      });
      return { success: true, message: "Schedule updated successfully" };
    } else {
      // Create new schedule
      await Schedule.create({
        userId: new Types.ObjectId(session.user.id),
        schedule: schedule
      });
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_CREATE,
        outcome: "success",
        userId: session.user?.id,
        resource: "createOrUpdateScheduleAction",
        message: "Schedule created",
      });
      return { success: true, message: "Schedule created successfully" };
    }
  } catch (error) {
    console.error("Error saving schedule:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_UPDATE,
      outcome: "failure",
      resource: "createOrUpdateScheduleAction",
      message: error instanceof Error ? error.message : String(error),
    });
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
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: "deleteScheduleAction",
        message: "Not authenticated",
      });
      return { success: false, message: "Not authenticated" };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Delete the schedule
    const result = await Schedule.deleteOne({ userId: session.user.id });

    if (result.deletedCount === 0) {
      await logSecurityEvent({
        event: SecurityEvent.OPERATION_DELETE,
        outcome: "failure",
        userId: session.user?.id,
        resource: "deleteScheduleAction",
        message: "No schedule found to delete",
      });
      return { success: false, message: "No schedule found to delete" };
    }

    await logSecurityEvent({
      event: SecurityEvent.OPERATION_DELETE,
      outcome: "success",
      userId: session.user?.id,
      resource: "deleteScheduleAction",
      message: "Schedule deleted",
    });

    return { success: true, message: "Schedule deleted successfully" };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_DELETE,
      outcome: "failure",
      resource: "deleteScheduleAction",
      message: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to delete schedule" };
  }
}
