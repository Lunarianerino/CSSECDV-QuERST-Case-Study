"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import AssignedExams from "@/components/exams/AssignedExams";

export default function TutorDashboard() {
  const [isLookingForStudents, setIsLookingForStudents] = useState(true);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-bold">100</h2>
            <p className="text-xs text-muted-foreground">Active sessions</p>
          </CardContent>
        </Card> */}
        {/* <Card>
          <CardHeader>
            Availability Status
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="looking-status"
                checked={isLookingForStudents}
                onCheckedChange={setIsLookingForStudents}
              />
              <Label htmlFor="looking-status">
                {isLookingForStudents ? "Looking for students" : "Not accepting students"}
              </Label>
            </div>
          </CardContent>
        </Card> */}
      </div>
      
      <AssignedExams showStats={true} />
    </div>
  );
}