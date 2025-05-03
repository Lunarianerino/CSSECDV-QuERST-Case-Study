"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BFIAttributes } from "@/models/bfi";
import { getExamsForBfiAction, getExamDetailsForBfiAction, saveBfiMappingsAction } from "@/lib/actions/bfiActions";
import { Loader2 } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  type: string;
  choices: Choice[];
  bfiAttribute: string | null;
  isReversed: boolean;
}

interface ExamDetails {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface BfiMapping {
  attribute: string;
  isReversed: boolean;
}

const Page = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bfiMappings, setBfiMappings] = useState<Map<string, BfiMapping>>(new Map());

  // Fetch all exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await getExamsForBfiAction();
        if (response.success && response.data) {
          setExams(response.data);

          const selectedExam = response.data.find(exam => exam.selected);
          if (selectedExam) {
            handleExamSelect(selectedExam.id);
          }
        } else {
          toast.error(response.message || "Failed to fetch exams");
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast.error("Failed to fetch exams");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch exam details when an exam is selected
  const handleExamSelect = async (examId: string) => {
    if (!examId) return;
    
    try {
      setLoading(true);
      setSelectedExamId(examId);
      setExamDetails(null);
      setBfiMappings(new Map());
      
      const response = await getExamDetailsForBfiAction(examId);
      if (response.success && response.data) {
        setExamDetails(response.data);
        
        // Initialize BFI mappings from existing data
        const newMappings = new Map<string, BfiMapping>();
        response.data.questions.forEach(question => {
          if (question.bfiAttribute) {
            newMappings.set(question.id, {
              attribute: question.bfiAttribute,
              isReversed: question.isReversed
            });
          }
        });
        setBfiMappings(newMappings);
      } else {
        toast.error(response.message || "Failed to fetch exam details");
      }
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast.error("Failed to fetch exam details");
    } finally {
      setLoading(false);
    }
  };

  // Handle BFI attribute selection for a question
  const handleBfiAttributeSelect = (questionId: string, attribute: string) => {
    setBfiMappings(prev => {
      const newMappings = new Map(prev);
      const currentMapping = newMappings.get(questionId) || { attribute: "", isReversed: false };
      newMappings.set(questionId, {
        ...currentMapping,
        attribute: attribute as BFIAttributes
      });
      return newMappings;
    });
  };

  // Handle reversed checkbox toggle
  const handleReversedToggle = (questionId: string, isReversed: boolean) => {
    setBfiMappings(prev => {
      const newMappings = new Map(prev);
      const currentMapping = newMappings.get(questionId) || { attribute: "", isReversed: false };
      newMappings.set(questionId, {
        ...currentMapping,
        isReversed
      });
      return newMappings;
    });
  };

  // Save BFI mappings
  const handleSaveBfiMappings = async () => {
    if (!selectedExamId || !examDetails) return;
    
    try {
      setSaving(true);
      
      // Convert Map to array of mappings
      const mappings = Array.from(bfiMappings.entries())
        .filter(([_, mapping]) => mapping.attribute) // Only include mappings with an attribute
        .map(([questionId, mapping]) => ({
          questionId,
          attribute: mapping.attribute as BFIAttributes,
          isReversed: mapping.isReversed,
        }));
      
      const response = await saveBfiMappingsAction({
        examId: selectedExamId,
        mappings,
      });
      
      if (response.success) {
        toast.success(response.message || "BFI mappings saved successfully");
      } else {
        toast.error(response.message || "Failed to save BFI mappings");
      }
    } catch (error) {
      console.error("Error saving BFI mappings:", error);
      toast.error("Failed to save BFI mappings");
    } finally {
      setSaving(false);
    }
  };

  // Format exams for combobox
  const examOptions = exams.map(exam => ({
    value: exam.id,
    label: exam.name,
  }));

  return (
    <DashboardLayout title="BFI Questionnaire">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Exam for BFI Assessment</CardTitle>
            <CardDescription>
              Choose an exam to designate as the BFI assessment. For each question, assign a BFI category (Extroversion, Neuroticism, Agreeableness, Conscientiousness, Openness) and indicate if the scoring is reversed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="exam-select" className="text-sm font-medium">Select Exam</label>
                <Combobox
                  options={examOptions}
                  value={selectedExamId}
                  onChange={handleExamSelect}
                  placeholder="Select an exam..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading BFI mappings...</span>
    </div>
        )}

        {!loading && examDetails && (
          <Card>
            <CardHeader>
              <CardTitle>{examDetails.name}</CardTitle>
              <CardDescription>{examDetails.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {examDetails.questions.map((question, qIndex) => (
                  <div key={question.id} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Question {qIndex + 1}</h3>
                      <p className="text-sm text-muted-foreground">{question.question}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Assign BFI attribute to this question</p>
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Available choices:</p>
                            <ul className="mt-1 space-y-1">
                              {question.choices.map((choice) => (
                                <li key={choice.id} className="text-xs">
                                  • {choice.text} {choice.isCorrect && "(Correct)"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-48">
                            <Select
                              value={(bfiMappings.get(question.id)?.attribute) || ""}
                              onValueChange={(value) => handleBfiAttributeSelect(question.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select BFI category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BFIAttributes).map(([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`reversed-${question.id}`}
                              checked={bfiMappings.get(question.id)?.isReversed || false}
                              onCheckedChange={(checked) => 
                                handleReversedToggle(question.id, checked as boolean)
                              }
                            />
                            <Label htmlFor={`reversed-${question.id}`} className="text-sm">
                              Reversed
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {qIndex < examDetails.questions.length - 1 && <Separator />}
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBfiMappings} 
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save BFI Mappings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Page;