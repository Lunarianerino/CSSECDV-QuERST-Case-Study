"use client";
import { useState, useEffect } from "react";
import { WeeklySchedule } from "@/types/schedule";
import { getUserSchedulesAction, findCommonAvailableTimes } from "@/lib/actions/getUserSchedulesAction";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type CommonAvailableTimesProps = {
  studentId: string;
  tutorId: string;
  onSelectTimes: (selectedTimes: SelectedTimeSlot[]) => void;
};

export type SelectedTimeSlot = {
  day: string;
  start: string;
  end: string;
};

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const CommonAvailableTimes = ({ studentId, tutorId, onSelectTimes }: CommonAvailableTimesProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commonTimes, setCommonTimes] = useState<Record<string, Array<{ start: string; end: string }>>>({});
  const [selectedTimes, setSelectedTimes] = useState<SelectedTimeSlot[]>([]);
  const [totalSelectedMinutes, setTotalSelectedMinutes] = useState(0);
  const [activeTab, setActiveTab] = useState("monday");
  const [customTimeSlot, setCustomTimeSlot] = useState<{day: string; start: string; end: string}>({
    day: "monday",
    start: "09:00",
    end: "10:00"
  });

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch schedules for both users
        const response = await getUserSchedulesAction([studentId, tutorId]);

        if (!response.success) {
          setError(response.message || "Failed to fetch schedules");
          return;
        }

        if (!response.data || Object.keys(response.data).length < 2) {
          setError("One or both users don't have schedules set up");
          return;
        }

        // Get the schedules from the response
        const schedules = response.data;
        const userIds = Object.keys(schedules);
        
        // Find common available times
        const common = await findCommonAvailableTimes(
          schedules[userIds[0]],
          schedules[userIds[1]]
        );

        setCommonTimes(common);

        // Set the first day as active tab by default
        setActiveTab("monday");
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError("An error occurred while fetching schedules");
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId && tutorId) {
      fetchSchedules();
    }
  }, [studentId, tutorId]);

  // Calculate total selected minutes whenever selectedTimes changes
  useEffect(() => {
    const totalMinutes = selectedTimes.reduce((total, timeSlot) => {
      const startMinutes = timeToMinutes(timeSlot.start);
      const endMinutes = timeToMinutes(timeSlot.end);
      return total + (endMinutes - startMinutes);
    }, 0);

    setTotalSelectedMinutes(totalMinutes);
    onSelectTimes(selectedTimes);
  }, [selectedTimes, onSelectTimes]);

  const handleTimeSlotToggle = (day: string, start: string, end: string, checked: boolean) => {
    if (checked) {
      // Add the time slot without any minute limitation
      setSelectedTimes([...selectedTimes, { day, start, end }]);
    } else {
      // Remove the time slot
      setSelectedTimes(
        selectedTimes.filter(
          (slot) => !(slot.day === day && slot.start === start && slot.end === end)
        )
      );
    }
  };

  // Helper function to convert time string (HH:MM) to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading available times...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // Check if there are any common times
  const hasCommonTimes = Object.values(commonTimes).some(times => times.length > 0);

  if (!hasCommonTimes) {
    return (
      <div className="text-center py-4 text-amber-600">
        <p>No common available times found between these users.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Both users need to set up their schedules with available time slots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Common Available Times</h3>
        <span className="text-sm text-muted-foreground">
          {totalSelectedMinutes} minutes selected
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 mb-4">
          {daysOfWeek.map((day) => (
            <TabsTrigger 
              key={day.value} 
              value={day.value}
              disabled={!commonTimes[day.value] || commonTimes[day.value].length === 0}
              className="text-xs"
            >
              {day.label.substring(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {daysOfWeek.map((day) => (
          <TabsContent key={day.value} value={day.value} className="space-y-2">
            {commonTimes[day.value] && commonTimes[day.value].length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {commonTimes[day.value].map((timeSlot, index) => {
                  const isSelected = selectedTimes.some(
                    (slot) =>
                      slot.day === day.value &&
                      slot.start === timeSlot.start &&
                      slot.end === timeSlot.end
                  );

                  // Calculate minutes for display purposes only
                  const slotMinutes = timeToMinutes(timeSlot.end) - timeToMinutes(timeSlot.start);
                  const wouldExceedLimit = false; // Remove the limitation

                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${day.value}-${index}`}
                        checked={isSelected}
                        disabled={wouldExceedLimit}
                        onCheckedChange={(checked) =>
                          handleTimeSlotToggle(
                            day.value,
                            timeSlot.start,
                            timeSlot.end,
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor={`${day.value}-${index}`}
                        className={`${wouldExceedLimit ? "text-muted-foreground" : ""}`}
                      >
                        {formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({slotMinutes} min)
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No common available times for {day.label}.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {selectedTimes.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <h4 className="text-sm font-medium mb-2">Selected Time Slots:</h4>
          <ul className="space-y-1">
            {selectedTimes.map((slot, index) => {
              const dayLabel = daysOfWeek.find(d => d.value === slot.day)?.label;
              const duration = timeToMinutes(slot.end) - timeToMinutes(slot.start);
              
              return (
                <li key={index} className="text-sm">
                  {dayLabel}: {formatTime(slot.start)} - {formatTime(slot.end)} ({duration} min)
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Custom Time Slot Input */}
      <div className="mt-6 p-4 border rounded-md">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium">Add Custom Time Slot</h4>
          <span className="text-xs text-muted-foreground">For times not in common availability</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <Label htmlFor="custom-day" className="text-xs mb-1 block">Day</Label>
            <Select 
              value={customTimeSlot.day} 
              onValueChange={(value) => setCustomTimeSlot({...customTimeSlot, day: value})}
            >
              <SelectTrigger id="custom-day" className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="custom-start-time" className="text-xs mb-1 block">Start Time</Label>
            <Input
              id="custom-start-time"
              type="time"
              value={customTimeSlot.start}
              onChange={(e) => setCustomTimeSlot({...customTimeSlot, start: e.target.value})}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="custom-end-time" className="text-xs mb-1 block">End Time</Label>
            <Input
              id="custom-end-time"
              type="time"
              value={customTimeSlot.end}
              onChange={(e) => setCustomTimeSlot({...customTimeSlot, end: e.target.value})}
              className="w-full"
            />
          </div>
        </div>
        
        <Button 
          size="sm" 
          className="w-full"
          onClick={() => {
            // Validate time format
            if (!customTimeSlot.start || !customTimeSlot.end) {
              toast.error("Please enter both start and end times");
              return;
            }
            
            // Validate that end time is after start time
            const startMinutes = timeToMinutes(customTimeSlot.start);
            const endMinutes = timeToMinutes(customTimeSlot.end);
            
            if (endMinutes <= startMinutes) {
              toast.error("End time must be after start time");
              return;
            }
            
            // Add the custom time slot
            setSelectedTimes([...selectedTimes, { 
              day: customTimeSlot.day, 
              start: customTimeSlot.start, 
              end: customTimeSlot.end 
            }]);
            
            toast.success("Custom time slot added");
          }}
        >
          Add Custom Time Slot
        </Button>
      </div>
    </div>
  );
};

export default CommonAvailableTimes;