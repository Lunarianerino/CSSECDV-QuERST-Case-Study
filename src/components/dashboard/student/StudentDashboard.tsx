
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import ExamCard from "@/components/exams/ExamCard";
import { AssignedExam, getAssignedExamsAction } from "@/lib/actions/getAssignedExamsAction";
import { UserExamStatus } from "@/models/examStatus";

export default function StudentDashboard() {
  const [assignedExams, setAssignedExams] = useState<AssignedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedExams = async () => {
      try {
        const exams = await getAssignedExamsAction();
        setAssignedExams(exams);
      } catch (error) {
        console.error("Error fetching assigned exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedExams();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-bold">{assignedExams.length}</h2>
            <p className="text-xs text-muted-foreground">Assigned exams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-bold">
              {assignedExams.filter(exam => exam.status === UserExamStatus.FINISHED).length}
            </h2>
            <p className="text-xs text-muted-foreground">Finished exams</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Assigned Exams</h2>
        {isLoading ? (
          <p>Loading exams...</p>
        ) : assignedExams.length === 0 ? (
          <p>No exams assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {assignedExams.map((exam) => (
              <ExamCard
                key={exam.id}
                id={exam.id}
                name={exam.name}
                description={exam.description}
                status={exam.status as UserExamStatus}
                score={exam.score}
                maxScore={exam.maxScore}
                results={exam.results}
                date={exam.completedAt ? new Date(exam.completedAt).toLocaleDateString() : undefined}
                attemptNumber={exam.attemptNumber}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}