import { saveExamAnswerAction, setFinishedExamStatusAction } from "@/lib/actions/examActions";
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

type Choice = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  choices?: Choice[];
  type?: string;
};

export type ExamState = {
  examId: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
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
  selectMultipleAnswers: (questionId: string, choiceIds: string[]) => void;
  selectTextAnswer: (questionId: string, text: string) => void;
  saveProgress: () => Promise<void>;
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
  
  const selectAnswer = (questionId: string, choiceId: string) => {
    // Only update the UI state without saving to database
    setState((prev) => {
      const newAnswers = { ...prev.answers, [questionId]: choiceId };
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  // Handle multiple choice answers
  const selectMultipleAnswers = (questionId: string, choiceIds: string[]) => {
    // Only update the UI state without saving to database
    setState((prev) => {
      const newAnswers = { ...prev.answers, [questionId]: choiceIds };
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  // Handle text answers
  const selectTextAnswer = (questionId: string, text: string) => {
    // Only update the UI state without saving to database
    setState((prev) => {
      const newAnswers = { ...prev.answers, [questionId]: text };
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  // Track if exam has been submitted to prevent duplicate submissions
  const hasSubmittedRef = React.useRef<boolean>(false);

  const submitExam = () => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) return;
    // check if all questions are answered
    if (Object.keys(state.answers).length !== state.questions.length) {
      toast.error("Please answer all questions before submitting", {
        description: `You have ${Object.keys(state.answers).length}/${state.questions.length} questions answered`,
      });
      return;
    }
    hasSubmittedRef.current = true;
    setState((prev) => ({ ...prev, isFinished: true }));
      
    setFinishedExamStatusAction(state.examId).then(() => {
      // console.log("Exam submitted:", state.answers);
      toast.success("Exam submitted successfully!", {
        description: `Completed with ${Object.keys(state.answers).length}/${state.questions.length} questions answered`,
      });
    }).catch((error) => {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam", {
        description: "Please try again",
      });
    });
  };

  const resetExam = () => {
    // Reset the submission tracking
    // console.log("Resetting exam...");
    hasSubmittedRef.current = false;
    lastToastTimeRef.current = 0;
    
    setState({
      ...initialState,
      startTime: Date.now(),
    });
  };

  // Save all current answers to the database
  const saveProgress = async () => {
    // Set saving state to true
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Get all answers that need to be saved
      const { answers, examId, questions } = state;
      const answerEntries = Object.entries(answers);
      
      // Save each answer to the database
      for (const [questionId, answer] of answerEntries) {
        // Find the question to determine its type
        const question = questions.find(q => q.id === questionId);
        const questionType = question?.type || 'choice';
        
        if (questionType === 'text') {
          // For text questions, save as text answer
          if (typeof answer === 'string') {
            await saveExamAnswerAction(examId, questionId, undefined, answer);
          }
        } else if (questionType === 'multiple_choice') {
          // For multiple choice questions, save as array of choice IDs
          if (Array.isArray(answer)) {
            await saveExamAnswerAction(examId, questionId, answer);
          }
        } else {
          // Default case: single choice question
          if (typeof answer === 'string') {
            await saveExamAnswerAction(examId, questionId, [answer]);
          } else if (Array.isArray(answer)) {
            // Handle case where answer might be stored as array even for single choice
            await saveExamAnswerAction(examId, questionId, answer);
          }
        }
      }
      
      // Show success toast
      toast.success("Progress saved", {
        description: `Saved ${answerEntries.length} answers`,
        position: "bottom-right",
      });
      
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast.error("Failed to save progress", {
        description: "Please try again",
      });
    } finally {
      // Set saving state back to false
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };
  
  return (
    <ExamContext.Provider
      value={{
        state,
        setState,
        setCurrentQuestion,
        selectAnswer,
        selectMultipleAnswers,
        selectTextAnswer,
        saveProgress,
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