import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { WeeklySchedule, TimeInterval } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { Calendar as BigCalendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getScheduleAction, createOrUpdateScheduleAction, deleteScheduleAction } from "@/lib/actions/scheduleActions";
import { toast } from "sonner";


const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { intervals: [] },
  tuesday: { intervals: [] },
  wednesday: { intervals: [] },
  thursday: { intervals: [] },
  friday: { intervals: [] },
  saturday: { intervals: [] },
  sunday: { intervals: [] },
};

const localizer = momentLocalizer(moment);

const ScheduleSelector = () => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch user's schedule on component mount
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        // console.log("Fetching response")

        const response = await getScheduleAction();
        // console.log(response)
        if (response.success && response.data) {
          // console.log(response)
          setSchedule(response.data);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        toast.error("Failed to load your schedule. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Convert schedule to events for react-big-calendar
  const events = useMemo(() => {
    const allEvents = [];

    // Create a base date for the week (using Monday as reference)
    const baseDate = new Date();
    const day = baseDate.getDay();
    // Adjust to previous Monday (0 is Sunday in JS)
    baseDate.setDate(baseDate.getDate() - day);
    baseDate.setHours(0, 0, 0, 0);

    // Add availability events
    Object.entries(schedule).forEach(([dayName, daySchedule], index) => {
        daySchedule.intervals.forEach((interval, intervalIndex) => {
          const eventDate = new Date(baseDate);
          eventDate.setDate(baseDate.getDate() + index);

          const [startHour, startMinute] = interval.start.split(":").map(Number);
          const [endHour, endMinute] = interval.end.split(":").map(Number);

          const startDate = new Date(eventDate);
          startDate.setHours(startHour, startMinute, 0, 0);

          const endDate = new Date(eventDate);
          endDate.setHours(endHour, endMinute, 0, 0);

          // Determine if the slot is available or assigned based on assignment property
          const isAssigned = interval.assignment !== undefined && interval.assignment !== null;
          
          // Get the assigned user's name if available
          const assignedUserName = isAssigned && interval.assignment && typeof interval.assignment === 'object' && 'name' in interval.assignment 
            ? (interval.assignment as any).name 
            : null;
          
          allEvents.push({
            id: `${isAssigned ? 'assigned' : 'availability'}-${dayName}-${intervalIndex}`,
            title: isAssigned ? (assignedUserName ? `${assignedUserName}` : "Reserved") : "Available",
            start: startDate,
            end: endDate,
            resource: { 
              type: isAssigned ? "assigned" : "availability", 
              day: dayName,
              assignment: interval.assignment
            },
          });
        });
    });

    return allEvents;
  }, [schedule]);

  // Custom event component to style availability and assignments
  const EventComponent = ({ event }: any) => {
    // Check if the event is assigned or available
    const isAssigned = event.resource.type === "assigned";
    
    // Handle click on available time slots to remove them
    const handleEventClick = () => {
      // Only allow removing available slots, not assigned ones
      if (!isAssigned) {
        const { day, type } = event.resource;
        const dayName = day as keyof WeeklySchedule;
        
        // Extract the time information from the event
        const startTime = `${event.start.getHours().toString().padStart(2, "0")}:${event.start
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        const endTime = `${event.end.getHours().toString().padStart(2, "0")}:${event.end
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        
        // Create a new schedule with the interval removed
        const updatedIntervals = schedule[dayName].intervals.filter(
          interval => !(interval.start === startTime && interval.end === endTime)
        );
        
        const updatedSchedule = {
          ...schedule,
          [dayName]: {
            ...schedule[dayName],
            intervals: updatedIntervals,
          },
        };
        
        setSchedule(updatedSchedule);
        toast.success("Time slot removed");
      }
    };
    
    return (
      <div 
        className={`h-full w-full p-1 overflow-hidden text-xs flex flex-col justify-start ${isAssigned ? "bg-orange-300" : "bg-primary/20 cursor-pointer hover:bg-primary/40"}`}
        onClick={!isAssigned ? handleEventClick : undefined}
        title={isAssigned ? "Reserved slot" : "Click to remove this available time slot"}
      >
        {event.title}
      </div>
    );
  };

  // Handle slot selection
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      // Get day name from the date
      const dayIndex = start.getDay();
      // Convert to our day format (0 = Sunday in JS, but we want Monday as index 0)
      // const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      const dayName = days[dayIndex] as keyof WeeklySchedule;

      // Format times to HH:MM format
      const startTime = `${start.getHours().toString().padStart(2, "0")}:${start
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const endTime = `${end.getHours().toString().padStart(2, "0")}:${end
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      // Check if this time is already in an interval
      const isInExistingInterval = schedule[dayName].intervals.some(
        (interval) => startTime >= interval.start && startTime < interval.end
      );

      const newInterval = { start: startTime, end: endTime, assignment: undefined };
      let updatedIntervals;

      if (isInExistingInterval) {
        // Remove or split the interval
        updatedIntervals = removeTimeRange(schedule[dayName].intervals, newInterval);
      } else {
        // Add and merge intervals
        updatedIntervals = [...schedule[dayName].intervals, newInterval];
        updatedIntervals = mergeIntervals(updatedIntervals);
      }

      const updatedSchedule = {
        ...schedule,
        [dayName]: {
          ...schedule[dayName],
          intervals: updatedIntervals,
        },
      };

      setSchedule(updatedSchedule);
    },
    [schedule, days]
  );

  const mergeIntervals = (intervals: TimeInterval[]): TimeInterval[] => {
    if (intervals.length <= 1) return intervals;

    const sortedIntervals = [...intervals].sort((a, b) => (a.start > b.start ? 1 : -1));
    const result = [];
    let current = sortedIntervals[0];

    for (let i = 1; i < sortedIntervals.length; i++) {
      // Only merge intervals if they have the same assignment status
      // Both should be either assigned or available (undefined assignment)
      const currentIsAssigned = current.assignment !== undefined && current.assignment !== null;
      const nextIsAssigned = sortedIntervals[i].assignment !== undefined && sortedIntervals[i].assignment !== null;
      
      // Only merge if both intervals have the same assignment status
      if (current.end >= sortedIntervals[i].start && currentIsAssigned === nextIsAssigned) {
        current.end = sortedIntervals[i].end > current.end ? sortedIntervals[i].end : current.end;
      } else {
        result.push(current);
        current = sortedIntervals[i];
      }
    }

    result.push(current);
    return result;
  };

  const removeTimeRange = (intervals: TimeInterval[], rangeToRemove: TimeInterval): TimeInterval[] => {
    const result = [];

    intervals.forEach(interval => {
      if (interval.end <= rangeToRemove.start || interval.start >= rangeToRemove.end) {
        result.push(interval);
        return;
      }

      if (interval.start < rangeToRemove.start && interval.end > rangeToRemove.end) {
        result.push({ start: interval.start, end: rangeToRemove.start });
        result.push({ start: rangeToRemove.end, end: interval.end });
        return;
      }

      if (interval.start < rangeToRemove.start) {
        result.push({ start: interval.start, end: rangeToRemove.start });
      } else if (interval.end > rangeToRemove.end) {
        result.push({ start: rangeToRemove.end, end: interval.end });
      }
    });

    return result;
  };

  // Custom toolbar to remove navigation and date display
  const CustomToolbar = () => null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await createOrUpdateScheduleAction(schedule);
      if (response.success) {
        toast.success(response.message || "Schedule saved successfully");
      } else {
        toast.error(response.message || "Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save your schedule. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  // const handleDelete = async () => {
  //   if (!confirm("Are you sure you want to delete your schedule? This action cannot be undone.")) {
  //     return;
  //   }
    
  //   setIsSaving(true);
  //   try {
  //     const response = await deleteScheduleAction();
  //     if (response.success) {
  //       setSchedule(DEFAULT_SCHEDULE);
  //       toast.success(response.message || "Schedule deleted successfully");
  //     } else {
  //       toast.error(response.message || "Failed to delete schedule");
  //     }
  //   } catch (error) {
  //     console.error("Error deleting schedule:", error);
  //     toast.error("Failed to delete your schedule. Please try again later.");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // Filter assigned events for the list view
  const assignedEvents = useMemo(() => {
    return events.filter(event => event.resource.type === "assigned");
  }, [events]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long'});
  };

  // Format time for display
  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">Weekly Schedule</div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-primary/20 rounded"></div>
          <span className="text-sm text-muted-foreground">Available</span>
          <div className="h-4 w-4 bg-orange-300 rounded ml-2"></div>
          <span className="text-sm text-muted-foreground">Reserved</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="h-[500px] w-full">
          <BigCalendar
            localizer={localizer}
            events={events}
            defaultView={Views.WEEK}
            views={[Views.WEEK]}
            step={30}
            timeslots={2}
            selectable
            onSelectSlot={handleSelectSlot}
            toolbar={false}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            formats={{
              dayFormat: (date) => {
                const dayIndex = date.getDay();
                return dayLabels[dayIndex];
              },
            }}
            min={new Date(0, 0, 0, 8, 0)} // Start at 8 AM
            max={new Date(0, 0, 0, 22, 0)} // End at 8 PM
          />
        </div>
      )}

      {/* Assigned Schedules List */}
      {!isLoading && assignedEvents.length > 0 && (
        <div className="mt-6 border rounded-md p-4">
          <h3 className="text-md font-medium mb-3">Reserved Time Slots</h3>
          <div className="space-y-2">
            {assignedEvents.map((event) => {
              const assignedTo = event.resource.assignment && 
                typeof event.resource.assignment === 'object' && 
                'name' in event.resource.assignment ? 
                (event.resource.assignment as any).name : 
                "Someone";
              
              return (
                <div 
                  key={event.id} 
                  className="flex justify-between items-center p-2 bg-muted/30 rounded hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{formatDate(event.start)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeDisplay(event.start)} - {formatTimeDisplay(event.end)}
                    </div>
                  </div>
                  <div className="text-sm">
                    Session with <span className="font-medium">{assignedTo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        {/* <Button 
          onClick={handleDelete} 
          variant="destructive" 
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Processing..." : "Delete Schedule"}
        </Button> */}
        <Button 
          onClick={handleSave} 
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </div>
  );
};

export default ScheduleSelector;
