import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  text: string;
  choices: Choice[];
};

type ExamState = {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  startTime: number;
  elapsed: number;
  isSaving: boolean;
  isFinished: boolean;
};

type ExamContextType = {
  state: ExamState;
  setCurrentQuestion: (index: number) => void;
  selectAnswer: (questionId: number, choiceId: string) => void;
  submitExam: () => void;
  resetExam: () => void;
};

// Sample exam data
const mockExamData: Question[] = [
  {
    id: 1,
    text: "What is the primary function of the operating system?",
    choices: [
      { id: "a", text: "Managing hardware resources" },
      { id: "b", text: "Running applications" },
      { id: "c", text: "Connecting to the internet" },
      { id: "d", text: "All of the above" },
    ],
  },
  {
    id: 2,
    text: "Which data structure uses LIFO (Last In, First Out) principle?",
    choices: [
      { id: "a", text: "Queue" },
      { id: "b", text: "Stack" },
      { id: "c", text: "Linked List" },
      { id: "d", text: "Binary Tree" },
    ],
  },
  {
    id: 3,
    text: "What does CSS stand for?",
    choices: [
      { id: "a", text: "Cascading Style Sheets" },
      { id: "b", text: "Computer Style Sheets" },
      { id: "c", text: "Creative Style System" },
      { id: "d", text: "Content Style Syntax" },
    ],
  },
  {
    id: 4,
    text: "Which protocol is used for secure communication over the internet?",
    choices: [
      { id: "a", text: "HTTP" },
      { id: "b", text: "FTP" },
      { id: "c", text: "HTTPS" },
      { id: "d", text: "SMTP" },
    ],
  },
  {
    id: 5,
    text: "What does API stand for in programming?",
    choices: [
      { id: "a", text: "Application Programming Interface" },
      { id: "b", text: "Application Process Integration" },
      { id: "c", text: "Advanced Programming Interface" },
      { id: "d", text: "Automated Process Interaction" },
    ],
  },
  {
    id: 6,
    text: "Which language is primarily used for styling web pages?",
    choices: [
      { id: "a", text: "HTML" },
      { id: "b", text: "JavaScript" },
      { id: "c", text: "CSS" },
      { id: "d", text: "PHP" },
    ],
  },
  {
    id: 7,
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
  questions: mockExamData,
  currentQuestionIndex: 0,
  answers: {},
  startTime: Date.now(),
  elapsed: 0,
  isSaving: false,
  isFinished: false,
};

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExamState>(initialState);

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

  // Track the last toast time to prevent duplicate toasts
  const lastToastTimeRef = React.useRef<number>(0);
  const toastDebounceTime = 800; // ms

  const selectAnswer = (questionId: number, choiceId: string) => {
    // First update the answers
    setState((prev) => {
      const newAnswers = { ...prev.answers, [questionId]: choiceId };
      
      return {
        ...prev,
        answers: newAnswers,
        isSaving: true,
      };
    });
    
    // Then handle the toast with debouncing
    const now = Date.now();
    if (now - lastToastTimeRef.current > toastDebounceTime) {
      lastToastTimeRef.current = now;
      
      // Show saving toast after a short delay
      setTimeout(() => {
        setState((currentState) => ({ ...currentState, isSaving: false }));
        toast.success("Progress saved", {
          description: `Question ${questionId} answered`,
          position: "bottom-right",
        });
      }, 600);
    } else {
      // Just update the saving state without showing toast
      setTimeout(() => {
        setState((currentState) => ({ ...currentState, isSaving: false }));
      }, 600);
    }
  };

  // Track if exam has been submitted to prevent duplicate submissions
  const hasSubmittedRef = React.useRef<boolean>(false);

  const submitExam = () => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) return;
    
    hasSubmittedRef.current = true;
    setState((prev) => ({ ...prev, isFinished: true }));
    
    toast.success("Exam submitted successfully!", {
      description: `Completed with ${Object.keys(state.answers).length}/${state.questions.length} questions answered`,
    });
  };

  const resetExam = () => {
    // Reset the submission tracking
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