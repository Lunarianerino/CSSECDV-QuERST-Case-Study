"use server";
import { connectToMongoDB } from "../db";
import { Schedule } from "@/models";
import { WeeklySchedule, TimeInterval } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

// Constants
const MINUTES_PER_SLOT = 60;
const AccountType = {
  ADMIN: "admin"
};

/**
 * Save paired schedules for two users
 * Only admins can use this function
 */
export async function savePairedScheduleAction(
  user1Id: string,
  user2Id: string,
  dayOfWeek: string,
  selectedIntervals: Array<{ start: string; end: string }>,
  customIntervals?: Array<{ start: string; end: string }> // Optional custom intervals that can be used in all cases
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Not authenticated", data: null };
    }

    // Verify the user is an admin
    if (session.user.type !== AccountType.ADMIN) {
      return { success: false, message: "Only admins can pair schedules", data: null };
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Find schedules for both users
    const userSchedules = await Schedule.find({
      userId: { $in: [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)] }
    });

    if (!userSchedules || userSchedules.length !== 2) {
      return { success: false, message: "Could not find schedules for both users", data: null };
    }

    // Map schedules by user ID
    const schedulesMap = userSchedules.reduce((acc, schedule) => {
      acc[schedule.userId.toString()] = schedule;
      return acc;
    }, {} as Record<string, any>);

    const user1Schedule = schedulesMap[user1Id];
    const user2Schedule = schedulesMap[user2Id];

    if (!user1Schedule || !user2Schedule) {
      return { success: false, message: "Missing schedule for one or both users", data: null };
    }

    // Determine which intervals to use (selected or custom)
    const intervalsToUse = customIntervals?.length ? customIntervals : selectedIntervals;
    
    // Create the assignment ID (using the session user's ID as the admin who created it)
    // const assignmentId = session.user.id;
    
    // Process each interval for both users
    const allUpdateResults = [];
    
    for (const interval of intervalsToUse) {
      // Convert time strings to minutes for easier manipulation
      const startMinutes = timeToMinutes(interval.start);
      const endMinutes = timeToMinutes(interval.end);
      const durationMinutes = endMinutes - startMinutes;
      
      // No minimum duration requirement - allow any time slot duration
      
      // Process each user's schedule for this interval
      const updateResults = await Promise.all([
        updateUserSchedule(user1Schedule, dayOfWeek, startMinutes, endMinutes, user2Id),
        updateUserSchedule(user2Schedule, dayOfWeek, startMinutes, endMinutes, user1Id)
      ]);
      
      if (updateResults.some(result => !result.success)) {
        return { 
          success: false, 
          message: `Failed to update one or both schedules for interval ${interval.start}-${interval.end}`, 
          data: updateResults.find(result => !result.success)?.error 
        };
      }
      
      allUpdateResults.push({
        interval,
        assignedSlots: updateResults[0].assignedSlots
      });
    }

    return { 
      success: true, 
      message: "Paired schedules saved successfully", 
      data: {
        user1Id,
        user2Id,
        dayOfWeek,
        intervals: allUpdateResults
      }
    };
  } catch (error) {
    console.error("Error saving paired schedules:", error);
    return { success: false, message: "Failed to save paired schedules", data: null };
  }
}

/**
 * Update a user's schedule with the assigned slots
 */
async function updateUserSchedule(
  userSchedule: any,
  dayOfWeek: string,
  startMinutes: number,
  endMinutes: number,
  assignmentId: string
) {
  try {
    const day = dayOfWeek.toLowerCase();
    const daySchedule = userSchedule.schedule[day];
    
    if (!daySchedule) {
      return { success: false, error: `Invalid day of week: ${dayOfWeek}` };
    }

    // Find intervals that overlap with our target interval
    const overlappingIntervals = daySchedule.intervals.filter(interval => {
      const intervalStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);
      return intervalStart < endMinutes && startMinutes < intervalEnd && !interval.assignment;
    });

    if (overlappingIntervals.length === 0) {
      // Allow custom intervals even when no overlapping intervals exist
      // This is now valid for all cases, not just when no common times exist
    }

    // Remove overlapping intervals
    const nonOverlappingIntervals = daySchedule.intervals.filter(interval => {
      const intervalStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);
      return !(intervalStart < endMinutes && startMinutes < intervalEnd && !interval.assignment);
    });

    // Create a single assigned slot with the exact time range specified
    const assignedSlots = [{
      start: minutesToTime(startMinutes),
      end: minutesToTime(endMinutes),
      assignment: assignmentId
    }];

    // Handle the intervals
    const newIntervals = [...nonOverlappingIntervals, ...assignedSlots];

    // Check if there was any time before the assigned slots in the original intervals
    overlappingIntervals.forEach(interval => {
      const intervalStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);
      
      // Add time before the assignment if it exists
      if (intervalStart < startMinutes) {
        newIntervals.push({
          start: interval.start,
          end: minutesToTime(startMinutes),
          assignment: undefined // Mark as available
        });
      }
      
      // Add time after the assignment if it exists
      // (This is already handled by the remaining time logic above)
    });

    // Sort intervals by start time
    newIntervals.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    // Update the schedule
    userSchedule.schedule[day].intervals = newIntervals;
    await userSchedule.save();

    return { 
      success: true, 
      assignedSlots: assignedSlots.map(slot => ({ start: slot.start, end: slot.end })) 
    };
  } catch (error) {
    console.error("Error updating user schedule:", error);
    return { success: false, error: "Failed to update user schedule" };
  }
}

/**
 * Find common available times between two users
 * Returns the full overlapping time intervals without dividing them
 */
export async function findCommonAvailableTimesWithMinDuration(
  schedule1: WeeklySchedule, 
  schedule2: WeeklySchedule,
  minDurationMinutes: number = 0 // No minimum duration by default
) {
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

          // Include the overlap if it meets the minimum duration (if specified)
          if (minDurationMinutes === 0 || overlapDuration >= minDurationMinutes) {
            // Add the full overlapping interval without dividing it
            commonTimes[day].push({
              start: minutesToTime(overlapStart),
              end: minutesToTime(overlapEnd)
            });
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