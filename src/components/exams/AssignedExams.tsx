"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExamCard from "@/components/exams/ExamCard";
import { AssignedExam, getAssignedExamsAction } from "@/lib/actions/getAssignedExamsAction";
import { UserExamStatus } from "@/models/examStatus";
import { ExamTypes } from "@/models/exam";

interface AssignedExamsProps {
  showStats?: boolean;
}

export default function AssignedExams({ showStats = true }: AssignedExamsProps) {
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

  // Group exams by type
  const groupedExams = assignedExams.reduce<Record<string, AssignedExam[]>>(
    (groups, exam) => {
      // Special case: BFI and VARK should be categorized as "Characteristic Questionnaires"
      if (exam.type === ExamTypes.BFI || exam.type === ExamTypes.VARK) {
        const groupKey = "Characteristic Questionnaires";
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(exam);
      } else {
        // For all other types, use the exam type as the group key
        if (!groups[exam.type]) {
          groups[exam.type] = [];
        }
        groups[exam.type].push(exam);
      }
      return groups;
    },
    {}
  );

  // Function to get a user-friendly name for each exam type section
  const getExamTypeName = (type: string): string => {
    switch (type) {
      case "Characteristic Questionnaires":
        return "Characteristic Questionnaires";
      case ExamTypes.SUMMATIVE:
        return "Summative Assessments";
      case ExamTypes.FORMATIVE:
        return "Formative Assessments";
      case ExamTypes.SURVEY:
        return "Surveys";
      case ExamTypes.DOMAIN:
        return "Domain Knowledge Tests";
      case ExamTypes.OTHERS:
        return "Other Assessments";
      default:
        return type;
    }
  };

  // Define the order of exam types to display
  const examTypeOrder = [
    "Characteristic Questionnaires",
    ExamTypes.DOMAIN,
    ExamTypes.SURVEY,
    ExamTypes.SUMMATIVE,
    ExamTypes.FORMATIVE,
    ExamTypes.OTHERS
  ];

  // Sort the exam types based on the defined order
  const sortedExamTypes = Object.keys(groupedExams).sort((a, b) => {
    const indexA = examTypeOrder.indexOf(a);
    const indexB = examTypeOrder.indexOf(b);
    
    // If both types are in our order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one type is in our order array, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither type is in our order array, sort alphabetically
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold">{assignedExams.length}</h2>
              <p className="text-xs text-muted-foreground">Assigned exams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold">
                {assignedExams.filter(exam => exam.status === UserExamStatus.FINISHED).length}
              </h2>
              <p className="text-xs text-muted-foreground">Finished exams</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Assigned Assessments and Questionnaires</h2>
        {isLoading ? (
          <p>Loading exams...</p>
        ) : assignedExams.length === 0 ? (
          <p>No exams assigned yet.</p>
        ) : (
          <div className="space-y-8">
            {sortedExamTypes.map((type) => (
              <div key={type} className="space-y-4">
                <h3 className="text-xl font-semibold">{getExamTypeName(type)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedExams[type].map((exam) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}