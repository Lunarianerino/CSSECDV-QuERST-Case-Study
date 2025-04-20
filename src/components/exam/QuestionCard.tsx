import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExam } from "@/context/ExamContext";
import { Textarea } from "@/components/ui/textarea";

interface QuestionCardProps {
  questionId: string;
  questionNumber: number;
  questionText: string;
  choices?: Array<{ id: string; text: string }>;
  selectedAnswer?: string | string[];
  questionType?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  questionNumber,
  questionText,
  choices,
  selectedAnswer,
  questionType = "choice",
}) => {
  const { selectAnswer, selectMultipleAnswers, selectTextAnswer, state } = useExam();
  const { isSaving } = state;

  const handleSelectOption = (choiceId: string) => {
    // Don't allow selection changes while saving
    if (isSaving) return;
    
    if (questionType === "choice") {
      // Single choice selection
      selectAnswer(questionId, choiceId);
    } else if (questionType === "multiple_choice") {
      // Multiple choice selection
      const currentSelections = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
      const index = currentSelections.indexOf(choiceId);
      
      if (index === -1) {
        // Add to selection
        currentSelections.push(choiceId);
      } else {
        // Remove from selection
        currentSelections.splice(index, 1);
      }
      
      selectMultipleAnswers(questionId, currentSelections);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    selectTextAnswer(questionId, e.target.value);
  };

  return (
    <Card className="w-full mb-6 border border-border/50 overflow-hidden shadow-sm animate-slide-in" style={{ animationDelay: `${questionNumber * 50}ms` }}>
      <CardHeader className="pb-3 pt-6">
        <CardTitle className="text-xl font-medium flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground text-sm">
            {questionNumber}
          </span>
          <span>{questionText}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        {questionType === "text" ? (
          // Text answer question
          <div className="mt-2">
            <Textarea
              placeholder="Type your answer here..."
              className="min-h-[120px]"
              value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
              onChange={handleTextChange}
              disabled={isSaving}
            />
          </div>
        ) : (
          // Choice-based questions (single or multiple)
          <div className="grid gap-3">
            {choices?.map((choice) => {
              const isSelected = questionType === "choice"
                ? selectedAnswer === choice.id
                : Array.isArray(selectedAnswer) && selectedAnswer.includes(choice.id);
              
              return (
                <div
                  key={choice.id}
                  className={cn(
                    "question-option",
                    isSelected && "selected",
                    isSaving && "opacity-70 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!isSaving) {
                      handleSelectOption(choice.id);
                    }
                  }}
                >
                  {questionType === "choice" ? (
                    // Single choice (radio button style)
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  ) : (
                    // Multiple choice (checkbox style)
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected ? 
                        <CheckSquare className="h-4 w-4" /> : 
                        <Square className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  )}
                  <span className="text-foreground">{choice.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;