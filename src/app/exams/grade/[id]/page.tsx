"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getExamByAttempt } from "@/lib/actions/examActions";
import { gradeExamAction } from "@/lib/actions/gradeExamAction";

interface Question {
  id: string;
  question: string;
  type: string;
  points?: number;
  choices?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface Answer {
  id?: string;
  questionId: string;
  answers_choice?: string[];
  answer_text?: string;
  score?: number;
}

interface ExamSubmission {
  id: string;
  name: string;
  description: string;
  attemptNumber: number;
  status: string;
  userId: string;
  userName: string;
  questions: Question[];
  answers: Answer[];
}

export default function GradeExamPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const attemptId = params.id as string;
        const data = await getExamByAttempt(attemptId);

        if (!data) {
          toast.error("Failed to load exam submission");
          return;
        }

        // Initialize scores for auto-grading
        const initialScores: Record<string, number> = {};
        let initialTotalScore = 0;
        let initialMaxScore = 0;

        // Calculate initial scores based on question types
        // Calculate initial scores based on question types
        // console.log(data.answers)
        data.questions.forEach(question => {
          const answer = data.answers.find(a => a.questionId === question.id);
          const questionPoints = question.points || 1;
          initialMaxScore += questionPoints;
          
          if (question.type === "choice") {
            // Single choice - auto grade
            if (answer?.answers_choice) {
              const selectedId = answer?.answers_choice?.[0]; // Take only the first selection
              const selectedChoice = question.choices?.find(c => c.id === selectedId);
              if (selectedChoice?.isCorrect) {
                initialScores[question.id] = questionPoints;
                initialTotalScore += questionPoints;
              } else {
                initialScores[question.id] = 0;
              }
            } else {
              initialScores[question.id] = 0;
            }
          } else if (question.type === "multiple_choice") {
            // Multiple choice - partial scoring with deductions
            if (answer?.answers_choice) {
              // Ensure answers_choice is always an array
              const choiceIds = Array.isArray(answer.answers_choice) ? answer.answers_choice : [answer.answers_choice];
              let correctCount = 0;
              let incorrectCount = 0;

              // Check each selected choice
              choiceIds.forEach(id => {
                const choice = question.choices?.find(c => c.id === id);
                if (choice?.isCorrect) {
                  correctCount++;
                } else {
                  incorrectCount++;
                }
              });

              const totalCorrectChoices = question.choices?.filter(c => c.isCorrect).length || 0;
              const scorePerCorrect = questionPoints / totalCorrectChoices;

              // Calculate score with deductions for incorrect answers
              const calculatedScore = Math.max(0, (correctCount * scorePerCorrect) - (incorrectCount * scorePerCorrect));
              initialScores[question.id] = Math.min(questionPoints, calculatedScore);
              initialTotalScore += initialScores[question.id];
            } else {
              initialScores[question.id] = 0;
            }
          } else {
            // Text answer - needs manual grading
            initialScores[question.id] = answer?.score || 0;
            initialTotalScore += initialScores[question.id];
          }
        });

        setSubmission(data as ExamSubmission);
        setScores(initialScores);
        setTotalScore(initialTotalScore);
        setMaxScore(initialMaxScore);
      } catch (error) {
        console.error("Error fetching exam submission:", error);
        toast.error("Failed to load exam submission");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id]);

  const handleScoreChange = (questionId: string, value: number, maxPoints: number) => {
    // Ensure score is not negative and not greater than max points
    const newScore = Math.max(0, Math.min(maxPoints, value));

    // Update scores state
    setScores(prev => {
      const newScores = { ...prev, [questionId]: newScore };

      // Recalculate total score
      const newTotal = Object.values(newScores).reduce((sum, score) => sum + score, 0);
      setTotalScore(newTotal);

      return newScores;
    });
  };

  const handleSaveGrades = async () => {
    if (!submission) return;

    try {
      setSaving(true);

      // Prepare data for saving
      const gradingData = {
        attemptId: submission.id,
        scores: Object.entries(scores).map(([questionId, score]) => ({
          questionId,
          score
        })),
        totalScore
      };

      // Save grades
      const result = await gradeExamAction(gradingData);

      if (result.success) {
        toast.success("Grades saved successfully");
        router.push("/exams");
      } else {
        toast.error(result.message || "Failed to save grades");
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Grading Exam">
        <div className="flex items-center justify-center h-64">
          <p>Loading exam submission...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!submission) {
    return (
      <DashboardLayout title="Grading Exam">
        <div className="flex items-center justify-center h-64">
          <p>Exam submission not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Grading: ${submission.name}`}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>
              Attempt #{submission.attemptNumber} by {submission.userName || "User"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Exam</p>
                <p>{submission.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p>{submission.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Current Score</p>
                <p>{totalScore.toFixed(1)} / {maxScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {submission.questions.map((question, index) => {
            const answer = submission.answers.find(a => a.questionId === question.id);
            const questionPoints = question.points || 1;

            return (
              <Card key={question.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="text-lg font-medium">
                    Question {index + 1}: {question.question}
                  </CardTitle>
                  <CardDescription>
                    {question.type === "choice" ? "Single Choice" :
                      question.type === "multiple_choice" ? "Multiple Choice" : "Text Answer"} -
                    {questionPoints} {questionPoints === 1 ? "point" : "points"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Display question and answer */}
                  <div className="space-y-4">
                    {question.type === "text" ? (
                      <div>
                        <p className="font-medium mb-2">Student's Answer:</p>
                        <div className="p-3 bg-muted rounded-md">
                          {answer?.answer_text || "No answer provided"}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-2">Choices:</p>
                        <ul className="space-y-2">
                        {question.choices?.map(choice => {
                            const isSelected = answer?.answers_choice?.includes(choice.id);
                            // console.log(choice.id)
                            // console.log(answer)
                            // console.log(isSelected)
                            return (
                              <li key={choice.id} className="flex items-start gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>
                                  {isSelected && "⚫"}
                                </div>
                                <div className="flex-1">
                                  <span className={choice.isCorrect ? "text-green-600 font-medium" : ""}>
                                    {choice.text}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <Separator />

                    {/* Grading section */}
                    <div>
                      <p className="font-medium mb-2">Grading:</p>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="0"
                          max={questionPoints}
                          step="0.1"
                          value={scores[question.id] || 0}
                          onChange={(e) => handleScoreChange(question.id, parseFloat(e.target.value), questionPoints)}
                          className="w-24"
                          disabled={question.type === "choice" && answer?.id !== undefined}
                        />
                        <span>/ {questionPoints}</span>
                      </div>

                      {question.type === "choice" && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Single-choice questions are auto-graded based on the correct answer.
                        </p>
                      )}

                      {question.type === "multiple_choice" && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Multiple-choice questions are scored with deductions for incorrect selections.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-medium">
            Total Score: {totalScore.toFixed(1)} / {maxScore.toFixed(1)} ({Math.round((totalScore / maxScore) * 100)}%)
          </div>
          <Button
            onClick={handleSaveGrades}
            disabled={saving}
            className="px-6"
          >
            {saving ? "Saving..." : "Save Grades"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}