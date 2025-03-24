import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExam } from "@/context/ExamContext";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ProgressPanel: React.FC = () => {
  const { state, setCurrentQuestion } = useExam();
  const { questions, answers, currentQuestionIndex, isSaving, elapsed } = state;
  
  const progressPercentage = (Object.keys(answers).length / questions.length) * 100;

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    parts.push(`${minutes.toString().padStart(2, '0')}m`);
    parts.push(`${secs.toString().padStart(2, '0')}s`);
    
    return parts.join(' ');
  };

  return (
    <Card className="border border-border/50 shadow-sm animate-fade-in h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Exam Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-4">
        {/* Progress section */}
        <div>
          <Progress 
            value={progressPercentage} 
            className="h-2" 
            style={{ "--progress-width": `${progressPercentage}%` } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className={cn("transition-all", isSaving && "text-primary animate-pulse-subtle")}>
              {isSaving ? "Saving..." : `${Object.keys(answers).length}/${questions.length} answered`}
            </span>
          </div>
        </div>

        <Separator />

        {/* Timer section */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Time Elapsed</span>
            </div>
            <div className="text-base font-semibold">{formatTime(elapsed)}</div>
          </div>
        </div>

        <Separator />

        {/* Questions list section */}
        <div>
          <p className="text-sm font-medium mb-3">Questions</p>
          <ScrollArea className="h-[220px] rounded-md border">
            <div className="p-4 space-y-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  className={cn(
                    "flex items-center w-full text-left px-3 py-2 rounded-md transition-all",
                    index === currentQuestionIndex 
                      ? "bg-primary/20 text-primary border border-primary"
                      : answers[question.id]
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => handleQuestionSelect(index)}
                >
                  <span className="mr-3 flex items-center justify-center w-6 h-6 rounded-full bg-background/60 text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">
                    Question {index + 1}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="progress-circle unanswered w-4 h-4"></div>
              <span className="text-muted-foreground">Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="progress-circle answered w-4 h-4"></div>
              <span className="text-muted-foreground">Answered</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressPanel;