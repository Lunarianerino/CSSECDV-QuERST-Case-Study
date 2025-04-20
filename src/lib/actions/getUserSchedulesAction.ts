"use server";
import { connectToMongoDB } from "../db";
import { Schedule } from "@/models";
import { WeeklySchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

/**
 * Get schedules for specific users by their IDs
 * This is used for finding common available times between users
 */
export async function getUserSchedulesAction(userIds: string[]) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Not authenticated", data: null };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Find schedules for the specified users
    const userSchedules = await Schedule.find({
      userId: { $in: userIds.map(id => new Types.ObjectId(id)) }
    }).lean();

    if (!userSchedules || userSchedules.length === 0) {
      return { success: true, message: "No schedules found", data: [] };
    }

    // Convert to plain JavaScript objects and map by userId
    const schedulesMap = userSchedules.reduce((acc, schedule) => {
      const userId = schedule.userId.toString();
      acc[userId] = JSON.parse(JSON.stringify(schedule.schedule));
      return acc;
    }, {} as Record<string, WeeklySchedule>);

    return { 
      success: true, 
      message: "Schedules retrieved successfully", 
      data: schedulesMap 
    };
  } catch (error) {
    console.error("Error retrieving schedules:", error);
    return { success: false, message: "Failed to retrieve schedules", data: null };
  }
}

/**
 * Find common available times between two users
 * Ensures time slots are at least 60 minutes and divides longer slots into 60-minute increments
 */
export async function findCommonAvailableTimes(schedule1: WeeklySchedule, schedule2: WeeklySchedule) {
  // Minimum duration in minutes (60 minutes)
  const MIN_DURATION_MINUTES = 60;
  
  const commonTimes: Record<string, Array<{ start: string; end: string }>> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };

  // Days of the week
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  // For each day, find overlapping intervals
  days.forEach(day => {
    const intervals1 = schedule1[day].intervals.filter(interval => !interval.assignment);
    const intervals2 = schedule2[day].intervals.filter(interval => !interval.assignment);

    // For each pair of intervals, check if they overlap
    intervals1.forEach(interval1 => {
      intervals2.forEach(interval2 => {
        // Convert time strings to minutes for easier comparison
        const start1 = timeToMinutes(interval1.start);
        const end1 = timeToMinutes(interval1.end);
        const start2 = timeToMinutes(interval2.start);
        const end2 = timeToMinutes(interval2.end);

        // Check if intervals overlap
        if (start1 < end2 && start2 < end1) {
          // Calculate the overlapping interval
          const overlapStart = Math.max(start1, start2);
          const overlapEnd = Math.min(end1, end2);
          const overlapDuration = overlapEnd - overlapStart;

          // Only include if overlap is at least 60 minutes
          if (overlapDuration >= MIN_DURATION_MINUTES) {
            // Calculate how many complete 60-minute slots we can fit
            const numSlots = Math.floor(overlapDuration / MIN_DURATION_MINUTES);
            
            // Create slots in 60-minute increments
            for (let i = 0; i < numSlots; i++) {
              const slotStart = overlapStart + (i * MIN_DURATION_MINUTES);
              const slotEnd = slotStart + MIN_DURATION_MINUTES;
              
              commonTimes[day].push({
                start: minutesToTime(slotStart),
                end: minutesToTime(slotEnd)
              });
            }
            
            // Add the remaining time if it's at least 60 minutes
            const remainingStart = overlapStart + (numSlots * MIN_DURATION_MINUTES);
            const remainingDuration = overlapEnd - remainingStart;
            
            if (remainingDuration >= MIN_DURATION_MINUTES) {
              commonTimes[day].push({
                start: minutesToTime(remainingStart),
                end: minutesToTime(overlapEnd)
              });
            }
          }
        }
      });
    });

    // Sort intervals by start time
    commonTimes[day].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  });

  return commonTimes;
}

// Helper function to convert time string (HH:MM) to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to convert minutes to time string (HH:MM)
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}