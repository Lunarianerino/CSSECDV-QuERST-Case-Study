import { saveExamAnswerAction } from "@/lib/actions/examActions";
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  choices: Choice[];
};

export type ExamState = {
  examId: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startTime: number;
  elapsed: number;
  isSaving: boolean;
  isFinished: boolean;
  loaded: boolean;
};

type ExamContextType = {
  state: ExamState;
  setState: React.Dispatch<React.SetStateAction<ExamState>>;
  setCurrentQuestion: (index: number) => void;
  selectAnswer: (questionId: string, choiceId: string) => void;
  submitExam: () => void;
  resetExam: () => void;
};

// Sample exam data
const mockExamData: Question[] = [
  {
    id: "1",
    text: "What is the primary function of the operating system?",
    choices: [
      { id: "a", text: "Managing hardware resources" },
      { id: "b", text: "Running applications" },
      { id: "c", text: "Connecting to the internet" },
      { id: "d", text: "All of the above" },
    ],
  },
  {
    id: "2",
    text: "Which data structure uses LIFO (Last In, First Out) principle?",
    choices: [
      { id: "a", text: "Queue" },
      { id: "b", text: "Stack" },
      { id: "c", text: "Linked List" },
      { id: "d", text: "Binary Tree" },
    ],
  },
  {
    id: "3",
    text: "What does CSS stand for?",
    choices: [
      { id: "a", text: "Cascading Style Sheets" },
      { id: "b", text: "Computer Style Sheets" },
      { id: "c", text: "Creative Style System" },
      { id: "d", text: "Content Style Syntax" },
    ],
  },
  {
    id: "4",
    text: "Which protocol is used for secure communication over the internet?",
    choices: [
      { id: "a", text: "HTTP" },
      { id: "b", text: "FTP" },
      { id: "c", text: "HTTPS" },
      { id: "d", text: "SMTP" },
    ],
  },
  {
    id: "5",
    text: "What does API stand for in programming?",
    choices: [
      { id: "a", text: "Application Programming Interface" },
      { id: "b", text: "Application Process Integration" },
      { id: "c", text: "Advanced Programming Interface" },
      { id: "d", text: "Automated Process Interaction" },
    ],
  },
  {
    id: "6",
    text: "Which language is primarily used for styling web pages?",
    choices: [
      { id: "a", text: "HTML" },
      { id: "b", text: "JavaScript" },
      { id: "c", text: "CSS" },
      { id: "d", text: "PHP" },
    ],
  },
  {
    id: "7",
    text: "What is the time complexity of binary search?",
    choices: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(n)" },
      { id: "c", text: "O(log n)" },
      { id: "d", text: "O(n log n)" },
    ],
  },
];

const initialState: ExamState = {
  examId: "1",
  questions: mockExamData,
  currentQuestionIndex: 0,
  answers: {},
  startTime: Date.now(),
  elapsed: 0,
  isSaving: false,
  isFinished: false,
  loaded: false,
};

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExamState>(initialState);
  console.log(state)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isFinished) {
        setState((prev) => ({
          ...prev,
          elapsed: Math.floor((Date.now() - prev.startTime) / 1000),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isFinished]);

  const setCurrentQuestion = (index: number) => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  };

  // Add a ref to track pending save operations
    const pendingSaveRef = React.useRef<Record<string, NodeJS.Timeout>>({});
    
    // Track the last toast time to prevent duplicate toasts
    const lastToastTimeRef = React.useRef<number>(0);
    const toastDebounceTime = 800; // ms
    const saveDebounceTime = 500; // ms for database operations
  
  const selectAnswer = async (questionId: string, choiceId: string) => {
    // Check if there are any pending save operations
    if (state.isSaving || Object.keys(pendingSaveRef.current).length > 0) {
      // Don't allow new selections while saving
      return;
    }
    
    // First update the UI immediately for responsiveness
    setState((prev) => {
      const newAnswers = { ...prev.answers, [questionId]: choiceId };
      
      return {
        ...prev,
        answers: newAnswers,
        isSaving: true,
      };
    });
    
    // Clear any pending save operation for this question
    if (pendingSaveRef.current[questionId]) {
      clearTimeout(pendingSaveRef.current[questionId]);
    }
    
    // Debounce the database operation
    pendingSaveRef.current[questionId] = setTimeout(async () => {
      try {
        // TODO: Perform the actual database operation here
        // TODO: multiple answers support in the future.
        await saveExamAnswerAction(state.examId, questionId, [choiceId]);
        console.log("Answer saved to database:", questionId, choiceId);
        
        // Show toast only if enough time has passed since last toast
        const now = Date.now();
        if (now - lastToastTimeRef.current > toastDebounceTime) {
          lastToastTimeRef.current = now;
          toast.success("Progress saved", {
            description: `Question ${questionId} answered`,
            position: "bottom-right",
          });
        }
      } catch (error) {
        console.error("Failed to save answer:", error);
        toast.error("Failed to save answer", {
          description: "Please try again",
        });
      } finally {
        // Clear the pending reference and update saving state
        delete pendingSaveRef.current[questionId];
        
        // Only set isSaving to false if there are no more pending saves
        if (Object.keys(pendingSaveRef.current).length === 0) {
          setState(prev => ({ ...prev, isSaving: false }));
        }
      }
    }, saveDebounceTime);
  };

  // Track if exam has been submitted to prevent duplicate submissions
  const hasSubmittedRef = React.useRef<boolean>(false);

  const submitExam = () => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) return;
    // check if all questions are answered
    //! This might break if multiple choices are implemented in the future
    if (Object.keys(state.answers).length !== state.questions.length) {
      toast.error("Please answer all questions before submitting", {
        description: `You have ${Object.keys(state.answers).length}/${state.questions.length} questions answered`,
      });
      return;
    }
    hasSubmittedRef.current = true;
    setState((prev) => ({ ...prev, isFinished: true }));
    
    //TODO: database operation here
    //TODO: update user's status and double check if the answers reflected in the database
    console.log("Exam submitted:", state.answers);
    toast.success("Exam submitted successfully!", {
      description: `Completed with ${Object.keys(state.answers).length}/${state.questions.length} questions answered`,
    });
  };

  const resetExam = () => {
    // Reset the submission tracking
    console.log("Resetting exam...");
    hasSubmittedRef.current = false;
    lastToastTimeRef.current = 0;
    
    setState({
      ...initialState,
      startTime: Date.now(),
    });
  };

  return (
    <ExamContext.Provider
      value={{
        state,
        setState,
        setCurrentQuestion,
        selectAnswer,
        submitExam,
        resetExam,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
};