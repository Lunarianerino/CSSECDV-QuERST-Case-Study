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

interface Exam {
  id: string;
  name: string;
  description: string;
}

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  bfiAttribute: string | null;
  isReversed: boolean;
}

interface Question {
  id: string;
  question: string;
  type: string;
  choices: Choice[];
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
          question.choices.forEach(choice => {
            if (choice.bfiAttribute) {
              newMappings.set(choice.id, {
                attribute: choice.bfiAttribute,
                isReversed: choice.isReversed
              });
            }
          });
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

  // Handle BFI attribute selection for an answer
  const handleBfiAttributeSelect = (choiceId: string, attribute: string) => {
    setBfiMappings(prev => {
      const newMappings = new Map(prev);
      const currentMapping = newMappings.get(choiceId) || { attribute: "", isReversed: false };
      newMappings.set(choiceId, {
        ...currentMapping,
        attribute: attribute as BFIAttributes
      });
      return newMappings;
    });
  };

  // Handle reversed checkbox toggle
  const handleReversedToggle = (choiceId: string, isReversed: boolean) => {
    setBfiMappings(prev => {
      const newMappings = new Map(prev);
      const currentMapping = newMappings.get(choiceId) || { attribute: "", isReversed: false };
      newMappings.set(choiceId, {
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
        .map(([answerId, mapping]) => ({
          answerId,
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
              Choose an exam to designate as the BFI assessment. For each answer, assign a BFI category (Extroversion, Neuroticism, Agreeableness, Conscientiousness, Openness) and indicate if the scoring is reversed.
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
            <p>Loading...</p>
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
                    
                    <div className="space-y-2">
                      {question.choices.map((choice) => {
                        const mapping = bfiMappings.get(choice.id) || { attribute: "", isReversed: false };
                        return (
                          <div key={choice.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex-1">
                              <p className="text-sm">{choice.text}</p>
                              {/* {choice.isCorrect && (
                                <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Correct Answer
                                </span>
                              )} */}
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="w-48">
                                <Select
                                  value={mapping.attribute || ""}
                                  onValueChange={(value) => handleBfiAttributeSelect(choice.id, value)}
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
                                  id={`reversed-${choice.id}`}
                                  checked={mapping.isReversed}
                                  onCheckedChange={(checked) => 
                                    handleReversedToggle(choice.id, checked as boolean)
                                  }
                                />
                                <Label htmlFor={`reversed-${choice.id}`} className="text-sm">
                                  Reversed
                                </Label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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