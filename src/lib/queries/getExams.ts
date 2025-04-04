
import { Exam } from "@/models";
import { connectToMongoDB } from "../db";

//TODO: Implement a function that returns exams assigned to a user.
export interface ExamDetails {
  id: string;
  name: string;
  description: string;
}
export default async function getExams(): Promise<ExamDetails[]> {
  await connectToMongoDB();
  const exams = await Exam.find({}, { _id: 1 ,name: 1, description: 1 });
  console.log(exams);
  const processed_exams = await exams.map((exam) => {
    return {
      id: exam._id.toString(),
      name: exam.name,
      description: exam.description,
    };
  });
  console.log(processed_exams);
  return processed_exams;
}