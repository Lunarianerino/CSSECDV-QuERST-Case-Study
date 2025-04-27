"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserExamStatus } from "@/models/examStatus";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface ExamSubmission {
  id: string;
  examId: string;
  examName: string;
  userId: string;
  userName: string;
  status: UserExamStatus;
  completedAt?: string;
  attemptNumber: number;
  score?: number;
  graded: boolean;
}

export default function ExamSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call to get submissions
        const response = await fetch('/api/exam-submissions');

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load exam submissions');
        // For now, we'll use empty array until the API is implemented
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleGradeClick = (submissionId: string) => {
    router.push(`/exams/grade/${submissionId}`);
  };

  return (
    <DashboardLayout title="Exam Submissions">
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading exam creation form...</p>
              </div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No submissions found</p>
              <p className="text-sm mt-2">When students complete exams, they will appear here for grading.</p>
              <Link href="/exams">
                <Button variant="outline" className="mt-4">Back to Exams</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.examName}</TableCell>
                    <TableCell>{submission.userName}</TableCell>
                    <TableCell>
                      <div className="space-x-1">
                        <Badge variant={submission.status === UserExamStatus.FINISHED ? "default" : "secondary"}>
                          {submission.status.toUpperCase()}
                        </Badge>
                        <Badge variant={submission.graded ? "default" : "outline"} className="mt-1">
                          {submission.graded ? "SUMMATIVE" : "FORMATIVE"}
                        </Badge>

                      </div>

                    </TableCell>
                    <TableCell>
                      {submission.completedAt ? new Date(submission.completedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{submission.attemptNumber}</TableCell>
                    <TableCell>
                      {submission.score !== undefined ?
                        <div className="flex flex-col">
                          <span>{submission.score || 0}</span>
                        </div> :
                        <Badge variant="outline">No Score</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleGradeClick(submission.id)}
                        disabled={submission.status !== UserExamStatus.FINISHED}
                        size="sm"
                      >
                        {submission.graded ? "Review" : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}