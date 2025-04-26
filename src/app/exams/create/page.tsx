"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { examSchema, examQuestionSchema, questionChoiceSchema, ExamFormValues, ExamQuestionFormValues, QuestionChoiceFormValues } from "@/lib/validations/exams";
import { createExam } from "@/lib/server/actions/exam";
import { ExamTypes } from "@/models/exam";
import { getExamTypes } from "@/lib/actions/examActions";
import { Switch } from "@/components/ui/switch";
// Define types for the form

// Define schemas for validation
//TODO: pag may time, separate the exam details card and the questions card into separate components, and replace exam details card with questions card when exam details are confirmed
const CreateExam = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestionFormValues[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentPoints, setCurrentPoints] = useState<number>(1);
  const [choices, setChoices] = useState<QuestionChoiceFormValues[]>([]);
  const [currentChoice, setCurrentChoice] = useState<string>("");
  const [examTypes, setExamTypes] = useState<ExamTypes[]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Configure form
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      description: "",
      required: false,
      graded: false,
      questions: [],
    },
  });

  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        setIsLoading(true);
        const results = await getExamTypes();
        setExamTypes(results);
      } catch (error) {
        toast.error("Failed to load exam types");
        console.error("Error fetching exam types:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExamTypes();
  }, []);
  
  // State for question type
  const [questionType, setQuestionType] = useState<"choice" | "multiple_choice" | "text">("choice");

  // Handler for adding a new choice
  const addChoice = () => {
    if (!currentChoice.trim()) return;

    const newChoice: QuestionChoiceFormValues = {
      id: crypto.randomUUID(), // Generate a unique ID
      text: currentChoice,
      isCorrect: false,
    };

    setChoices([...choices, newChoice]);
    setCurrentChoice("");
  };

  // Handler for removing a choice
  const removeChoice = (id: string) => {
    setChoices(choices.filter(choice => choice.id !== id));
  };

  // Handler for toggling correct answer
  const toggleCorrect = (id: string) => {
    // if (questionType === "choice") {
    //   // For single choice questions, only one answer can be correct
    //   setChoices(
    //     choices.map(choice =>
    //       choice.id === id
    //         ? { ...choice, isCorrect: true }
    //         : { ...choice, isCorrect: false }
    //     )
    //   );
    // } else {
    //   // For multiple choice questions, multiple answers can be correct
    //   setChoices(
    //     choices.map(choice =>
    //       choice.id === id
    //         ? { ...choice, isCorrect: !choice.isCorrect }
    //         : choice
    //     )
    //   );
    // }

    setChoices(
      choices.map(choice =>
        choice.id === id
          ? { ...choice, isCorrect: !choice.isCorrect }
          : choice
      )
    );
  };

  // Handler for adding a question
  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (questionType === "choice" || questionType === "multiple_choice") {
      if (choices.length < 2) {
        toast.error("A question must have at least 2 choices");
        return;
      }

      if (!choices.some(choice => choice.isCorrect)) {
        toast.error("You must mark at least one correct answer");
        return;
      }
    }

    const newQuestion: ExamQuestionFormValues = {
      id: crypto.randomUUID(), // Generate a unique ID
      question: currentQuestion,
      type: questionType,
      choices: questionType !== "text" ? [...choices] : undefined,
      points: currentPoints || 1,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion("");
    setCurrentPoints(1);
    setChoices([]);
    toast.success("Question added");
  };

  // Handler for removing a question
  const removeQuestion = (index: string) => {
    const idx = parseInt(index);
    setQuestions(questions.filter((_, i) => i !== idx));
    toast.success("Question removed");
  };

  // Handle form submission
  const onSubmit = async (data: ExamFormValues) => {
    if (questions.length === 0) {
      toast.error("You must add at least one question");
      return;
    }

    // Here you would typically save the exam to your backend
    const examData = {
      ...data,
      questions: questions
    };
    // console.log("Exam data:", examData);
    const results = await createExam(examData);
    if (results.status !== 200) {
      toast.error(`Error creating exam: ${results.error}`);
      // console.log(results);
      return;
    }

    toast.success("Exam created successfully");
    //TODO: ideally, iba dapat to for admins
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading exam creation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">Create New Exam</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter exam title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter exam description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Graded Exam</FormLabel>
                        <FormDescription>
                          Enable if this exam should be graded
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Required Exam</FormLabel>
                        <FormDescription>
                          Enable if this exam is mandatory
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          {examTypes?.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {/* <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={async () => {
                      // Validate exam details
                      const isValid = await form.trigger(["name", "description"]);
                      if (isValid) {
                        // Disable exam details fields
                        form.getValues();
                        // Show questions section
                        document.getElementById("questions-section")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Confirm Details
                  </Button>
                </div> */}
              </CardContent>
            </Card>

            <Card id="questions-section">
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new question */}
                <div className="space-y-4 p-4 border rounded-md">
                  <div>
                    <FormLabel htmlFor="question">Question Text</FormLabel>
                    <Textarea
                      id="question"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Enter question text"
                      className="min-h-[60px]"
                    />
                  </div>

                  <div>
                    <FormLabel htmlFor="questionType">Question Type</FormLabel>
                    <Select
                      value={questionType}
                      onValueChange={(value: "choice" | "multiple_choice" | "text") => {
                        setQuestionType(value);
                        // Clear choices if switching to text question
                        if (value === "text") {
                          setChoices([]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="choice">Single Choice</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="text">Text Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel htmlFor="points">Points</FormLabel>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={currentPoints}
                      onChange={(e) => setCurrentPoints(parseInt(e.target.value))}
                      // disabled={!form.watch("graded")}
                    />
                  </div>

                  {(questionType === "choice" || questionType === "multiple_choice") && (
                    <div className="space-y-2">
                      <FormLabel>Choices</FormLabel>
                      <div className="mb-2 text-sm text-muted-foreground">
                        {questionType === "choice" 
                          ? "Select one correct answer" 
                          : "Select one or more correct answers"}
                      </div>

                      {choices.map((choice) => (
                        <div key={choice.id} className="flex items-center space-x-2">
                          <Input
                            value={choice.text}
                            onChange={(e) => {
                              setChoices(
                                choices.map(c =>
                                  c.id === choice.id ? { ...c, text: e.target.value } : c
                                )
                              );
                            }}
                            className="flex-1"
                          />
                          <Select
                            value={choice.isCorrect ? "correct" : "incorrect"}
                            onValueChange={(value) => toggleCorrect(choice.id)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="correct">Correct</SelectItem>
                              <SelectItem value="incorrect">Incorrect</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeChoice(choice.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex space-x-2">
                        <Input
                          value={currentChoice}
                          onChange={(e) => setCurrentChoice(e.target.value)}
                          placeholder="Add a choice"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addChoice}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Choice
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {questionType === "text" && (
                    <div className="p-4 border rounded-md bg-secondary/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        Students will answer this question with a text response.
                      </p>
                      <div className="p-3 border rounded-md bg-background">
                        <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                        <Textarea 
                          disabled 
                          placeholder="Student will type their answer here..."
                          className="min-h-[60px] bg-background"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={addQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {/* List of added questions */}
                {questions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Added Questions</h3>
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Question {index + 1}</p>
                            <p>{question.question}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeQuestion(index.toString())}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">Type: {question.type === "choice" ? "Single Choice" : question.type === "multiple_choice" ? "Multiple Choice" : "Text Answer"}</p>
                          <p className="text-sm font-mediu">Points: {question.points} </p>
                          {question.choices && question.choices.length > 0 && (
                            <>
                              <p className="text-sm font-medium">Choices:</p>
                              <ul className="pl-5 list-disc text-sm">
                                {question.choices.map((choice, choiceIndex) => (
                                  <li key={choiceIndex} className={choice.isCorrect ? "text-green-600 font-medium" : ""}>
                                    {choice.text} {choice.isCorrect && "(Correct)"}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {question.type === "text" && (
                            <p className="text-sm italic">Students will provide a text answer</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard")}>
                Cancel
              </Button>
              <Button type="submit">
                Create Exam
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateExam;
