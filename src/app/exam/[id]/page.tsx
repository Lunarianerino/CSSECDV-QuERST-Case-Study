"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/exam/QuestionCard";
import ProgressPanel from "@/components/exam/ProgressPanel";
import { ExamProvider, useExam } from "@/context/ExamContext";
import { cn } from "@/lib/utils";
import { redirect, useParams } from "next/navigation";
import { getExamByAttempt, setStartedExamStatusAction } from "@/lib/actions/examActions";

//TODO: FIX in the future (add toast)
const ExamContent = () => {
  const { state, setCurrentQuestion, submitExam, setState, saveProgress } = useExam();
  const { questions, currentQuestionIndex, answers } = state;
  const [isSaving, setIsSaving] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const attemptId = params.id as string;
  
  // Use useEffect for data fetching
  useEffect(() => {
    const fetchExam = async () => {
      try {
        // Use the server action instead of direct DB acess
        const examDetails = await getExamByAttempt(attemptId);
        if (!examDetails) {
          console.error("Exam not found");
          return; 
        }
        // console.log(examDetails);
        
        if (examDetails?.questions) {
          // Map API question format to match ExamContext Question format
          const formattedQuestions = examDetails.questions.map(q => ({
            id: q.id,
            text: q.question, // Map 'question' field to 'text' field
            type: q.type || 'choice', // Default to 'choice' if type is not specified
            choices: q.choices?.map(c => ({
              id: c.id,
              text: c.text,
              // We can safely include isCorrect here since it's coming from the server
              isCorrect: c.isCorrect
            })) || []
          }));

          // Convert the answers array from the API to the expected Record format
          const formattedAnswers: Record<string, string | string[]> = {};
          if (examDetails.answers && examDetails.answers.length > 0) {
            examDetails.answers.forEach(answer => {
              if (answer.questionId) {
                // Handle different answer types based on question type
                if (answer.answers_choice && answer.answers_choice.length > 0) {
                  // For choice questions, use the answers_choice array
                  formattedAnswers[answer.questionId] = 
                    answer.answers_choice.length === 1 ? answer.answers_choice[0] : answer.answers_choice;
                } else if (answer.answer_text) {
                  // For text questions, use the answer_text field
                  formattedAnswers[answer.questionId] = answer.answer_text;
                }
              }
            });
          }

          // Update the exam state with the formatted questions and answers
          setState(prev => ({
            ...prev,
            examId: examDetails.id,
            questions: formattedQuestions,
            currentQuestionIndex: 0,
            answers: formattedAnswers,
            startTime: Date.now(),
            elapsed: 0,
            isSaving: false,
            isFinished: false,
            loaded: true
          }));

          // console.log(state)

        }

        try {
          await setStartedExamStatusAction(attemptId);
        } catch (error) {
          console.error("Error setting started exam status:", error); 
        }
      } catch (error) {
        //redirect to 404
        //TODO: dont just redirect to dashboard lol
        redirect("/dashboard");
        console.error("Error fetching exam:", error);
      }
    };
    
    fetchExam();
  }, [attemptId, setState]);
  
  // Rest of your component remains the same
  useEffect(() => {
    // Smooth scroll to top when changing questions
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (state.isFinished) {
      // console.log("Exam finished!");
      redirect("/dashboard"); 
    }
  }, [state.isFinished])
  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save progress before moving to the next question
      setIsSaving(true);
      await saveProgress();
      setCurrentQuestion(currentQuestionIndex + 1);
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Save progress before submitting the exam
    setIsSaving(true);
    await saveProgress();
    await submitExam();
    setIsSaving(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;

  //TODO: Replace with loading context
  if (state.loaded === false) {
    return <div>Loading... (Replace with loading context)</div>;
  }
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
            questionType={currentQuestion.type || 'choice'}
          />

          <div className="flex justify-between mt-8 mb-20">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSaving}
              className="transition-all"
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
              onClick={handleSubmit}
              className={cn(
                "bg-primary text-primary-foreground transition-all",
                allQuestionsAnswered && "animate-pulse-subtle"
              )}
              disabled={!allQuestionsAnswered || isSaving}
            >
              Submit Exam
            </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="outline"
                className="transition-all"
                disabled={isSaving}
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
              {/* <Button
                onClick={handleSubmit}
                className={cn(
                  "bg-primary text-primary-foreground transition-all",
                  allQuestionsAnswered && "animate-pulse-subtle"
                )}
                disabled={!allQuestionsAnswered}
              >
                Submit Exam
              </Button> */}
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
