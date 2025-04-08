import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExam } from "@/context/ExamContext";

interface QuestionCardProps {
  questionId: string;
  questionNumber: number;
  questionText: string;
  choices: Array<{ id: string; text: string }>;
  selectedAnswer?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  questionNumber,
  questionText,
  choices,
  selectedAnswer,
}) => {
  const { selectAnswer, state } = useExam();
  const { isSaving } = state;

  const handleSelectOption = (choiceId: string) => {
    selectAnswer(questionId, choiceId);
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
        <div className="grid gap-3">
          {choices.map((choice) => (
            <div
              key={choice.id}
              className={cn(
                "question-option",
                selectedAnswer === choice.id && "selected",
                isSaving && "opacity-70 cursor-not-allowed"
              )}
              onClick={() => {
                if (!isSaving) {
                  handleSelectOption(choice.id);
                }
              }}
            >
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedAnswer === choice.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedAnswer === choice.id && <Check className="h-3 w-3" />}
                </div>
                <span className="text-foreground">{choice.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;