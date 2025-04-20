"use client";
import { useState } from "react";
import { WeeklySchedule } from "@/types/schedule";
import ScheduleSelector from "@/components/schedule/ScheduleSelector";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, LayoutDashboard, Book, Users } from "lucide-react";

const SchedulePage = () => {
  return (
    <DashboardLayout title="Manage Schedule">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Set Your Weekly Availability</h1>
        </div>

        <p className="text-muted-foreground mb-4">
          Configure when you're available to teach during the week. Students will only be able to book sessions during these times.
        </p>

        <ScheduleSelector/>
        
        {/* <div className="bg-muted/50 p-4 rounded-lg mt-4">
          <h3 className="font-medium mb-2">Tips:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Toggle each day to mark as available or unavailable</li>
            <li>Add multiple time slots per day if needed (e.g., morning and evening availability)</li>
            <li>Don't forget to save your changes</li>
          </ul>
        </div> */}
      </div>
    </DashboardLayout>
  );
};

export default SchedulePage;
