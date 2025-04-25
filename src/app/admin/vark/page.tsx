"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { VARKAttributes } from "@/models/vark";
import { getExamsForVarkAction, getExamDetailsForVarkAction, saveVarkMappingsAction } from "@/lib/actions/varkActions";

interface Exam {
  id: string;
  name: string;
  description: string;
}

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  varkAttribute: string | null;
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

const Page = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [varkMappings, setVarkMappings] = useState<Map<string, VARKAttributes>>(new Map());

  // Fetch all exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await getExamsForVarkAction();
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
      setVarkMappings(new Map());
      
      const response = await getExamDetailsForVarkAction(examId);
      if (response.success && response.data) {
        setExamDetails(response.data);
        
        // Initialize VARK mappings from existing data
        const newMappings = new Map<string, VARKAttributes>();
        response.data.questions.forEach(question => {
          question.choices.forEach(choice => {
            if (choice.varkAttribute) {
              newMappings.set(choice.id, choice.varkAttribute as VARKAttributes);
            }
          });
        });
        setVarkMappings(newMappings);
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

  // Handle VARK attribute selection for an answer
  const handleVarkAttributeSelect = (choiceId: string, attribute: string) => {
    setVarkMappings(prev => {
      const newMappings = new Map(prev);
      newMappings.set(choiceId, attribute as VARKAttributes);
      return newMappings;
    });
  };

  // Save VARK mappings
  const handleSaveVarkMappings = async () => {
    if (!selectedExamId || !examDetails) return;
    
    try {
      setSaving(true);
      
      // Convert Map to array of mappings
      const mappings = Array.from(varkMappings.entries()).map(([answerId, attribute]) => ({
        answerId,
        attribute,
      }));
      
      const response = await saveVarkMappingsAction({
        examId: selectedExamId,
        mappings,
      });
      
      if (response.success) {
        toast.success(response.message || "VARK mappings saved successfully");
      } else {
        toast.error(response.message || "Failed to save VARK mappings");
      }
    } catch (error) {
      console.error("Error saving VARK mappings:", error);
      toast.error("Failed to save VARK mappings");
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
    <DashboardLayout title="VARK Questionnaire">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Exam for VARK Assessment</CardTitle>
            <CardDescription>
              Choose an exam to designate as the VARK assessment. For each answer, assign a VARK category (Visual, Auditory, Read/Write, or Kinesthetic).
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
                      {question.choices.map((choice) => (
                        <div key={choice.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex-1">
                            <p className="text-sm">{choice.text}</p>
                            {choice.isCorrect && (
                              <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Correct Answer
                              </span>
                            )}
                          </div>
                          <div className="w-48">
                            <Select
                              value={varkMappings.get(choice.id) || ""}
                              onValueChange={(value) => handleVarkAttributeSelect(choice.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select VARK category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(VARKAttributes).map(([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {qIndex < examDetails.questions.length - 1 && <Separator />}
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveVarkMappings} 
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save VARK Mappings"}
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