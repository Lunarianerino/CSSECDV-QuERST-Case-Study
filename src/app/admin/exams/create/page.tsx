"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define types for the form
type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  text: string;
  points: number;
  choices: Choice[];
};

// Define schemas for validation
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

const CreateExam = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentPoints, setCurrentPoints] = useState<number>(1);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [currentChoice, setCurrentChoice] = useState<string>("");

  // Configure form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Handler for adding a new choice
  const addChoice = () => {
    if (!currentChoice.trim()) return;
    
    const newChoice: Choice = {
      id: Date.now().toString(),
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
    if (!currentQuestion.trim() || choices.length < 2) {
      toast.error("A question must have at least 2 choices");
      return;
    }

    if (!choices.some(choice => choice.isCorrect)) {
      toast.error("You must mark at least one correct answer");
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: currentQuestion,
      points: currentPoints,
      choices: [...choices],
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion("");
    setCurrentPoints(1);
    setChoices([]);
    toast.success("Question added");
  };

  // Handler for removing a question
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(question => question.id !== id));
    toast.success("Question removed");
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (questions.length === 0) {
      toast.error("You must add at least one question");
      return;
    }

    // Here you would typically save the exam to your backend
    console.log("Exam data:", { ...data, questions });
    
    toast.success("Exam created successfully");
    router.push("/admin/exams");
  };

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
                  name="title"
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
              </CardContent>
            </Card>

            <Card>
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
                    <FormLabel htmlFor="points">Points</FormLabel>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={currentPoints}
                      onChange={(e) => setCurrentPoints(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Choices</FormLabel>
                    
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
                            <p className="font-medium">Question {index + 1} ({question.points} points)</p>
                            <p>{question.text}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeQuestion(question.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">Choices:</p>
                          <ul className="pl-5 list-disc text-sm">
                            {question.choices.map((choice) => (
                              <li key={choice.id} className={choice.isCorrect ? "text-green-600 font-medium" : ""}>
                                {choice.text} {choice.isCorrect && "(Correct)"}
                              </li>
                            ))}
                          </ul>
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