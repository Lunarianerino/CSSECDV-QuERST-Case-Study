import * as z from "zod";

export const questionChoiceSchema = z.object({
  id: z.string(),
  text: z.string().min(1, { message: "Text is required" }),
  isCorrect: z.boolean().default(false),
});

export const examQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, { message: "Question is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  choices: z.array(questionChoiceSchema).optional(),
  points: z.number().optional(),
}).refine((data) => {
  if (data.type === "choice") {
    return data.choices && data.choices.length > 0;
  } 
  return true;
}, {
  message: "At least one choice is required for multiple choice questions",
  path: ["choices"],
});

export const examSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  required: z.boolean().default(false),
  graded: z.boolean().default(false),
  questions: z.array(examQuestionSchema),
})

export type ExamFormValues = z.infer<typeof examSchema>;
export type ExamQuestionFormValues = z.infer<typeof examQuestionSchema>;
export type QuestionChoiceFormValues = z.infer<typeof questionChoiceSchema>;
