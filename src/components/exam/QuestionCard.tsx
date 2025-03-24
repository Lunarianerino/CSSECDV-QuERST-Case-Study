import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExam } from "@/context/ExamContext";

interface QuestionCardProps {
  questionId: number;
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
  const { selectAnswer } = useExam();

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
                selectedAnswer === choice.id && "selected"
              )}
              onClick={() => handleSelectOption(choice.id)}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary">
                {selectedAnswer === choice.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-3 w-3 rounded-full" />
                )}
              </div>
              <div className="option-content">
                <div className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {choice.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;