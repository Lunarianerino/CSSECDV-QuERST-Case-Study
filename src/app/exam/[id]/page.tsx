"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import QuestionCard from "@/components/exam/QuestionCard";
import ProgressPanel from "@/components/exam/ProgressPanel";
import { ExamProvider, useExam } from "@/context/ExamContext";
import { cn } from "@/lib/utils";

const ExamContent = () => {
  const { state, setCurrentQuestion, submitExam } = useExam();
  const { questions, currentQuestionIndex, answers } = state;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scroll to top when changing questions
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    submitExam();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12"
      >
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-medium tracking-tight mb-2">Multiple Choice Exam</h1>
            <p className="text-muted-foreground">Answer all {questions.length} questions and submit your exam.</p>
          </header>

          <QuestionCard
            questionId={currentQuestion.id}
            questionNumber={currentQuestionIndex + 1}
            questionText={currentQuestion.text}
            choices={currentQuestion.choices}
            selectedAnswer={answers[currentQuestion.id]}
          />

          <div className="flex justify-between mt-8 mb-20">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="transition-all"
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                className="bg-primary text-primary-foreground transition-all"
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="outline"
                className="transition-all"
              >
                Next
              </Button>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 glass-morphism py-4 z-10 border-t">
            <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{answeredCount}</span> of <span className="font-medium text-foreground">{questions.length}</span> questions answered
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                className={cn(
                  "bg-primary text-primary-foreground transition-all",
                  allQuestionsAnswered && "animate-pulse-subtle"
                )}
                disabled={!allQuestionsAnswered}
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden md:block w-80 lg:w-96 border-l border-border/50 bg-secondary/20 p-6 overflow-y-auto">
        <ProgressPanel />
      </aside>
    </div>
  );
};

const ExamPage = () => {
  return (
    <main>
      <ExamProvider>
        <ExamContent />
      </ExamProvider>
    </main>
  );
};

export default ExamPage;
