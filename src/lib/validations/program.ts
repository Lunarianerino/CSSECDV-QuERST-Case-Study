import * as z from "zod";

export const programSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }).max(100),
    description: z.string().min(1, { message: "Description is required" }).max(500),
    startDate: z.date(),
    endDate: z.date(),
}).refine(
    (data) => data.endDate >= data.startDate,
    {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
    }
);

export type ProgramFormValues = z.infer<typeof programSchema>;
