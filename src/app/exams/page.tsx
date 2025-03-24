
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ExamCard from "@/components/exams/ExamCard";

const StatusCircle = ({ status }: { status: string }) => {
  const circleColor = {
    "Finished": "bg-green-500",
    "Started": "bg-yellow-500",
    "Not Started": "bg-red-500"
  }[status] || "bg-gray-500";

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${circleColor}`} />
      {status}
    </div>
  );
};

export default function ExamsPage() {
  const router = useRouter();
	const sampleExams = [
		{
			id: "1",
			title: "Personality Exam",
			description: "A test to measure your personality traits",
			date: "2023-05-01",
			status: "Finished",
			results: "Not Graded"

		},
		{
			id: "2",
			title: "Learning/Teaching Style Exam",
			description: "A test to determine your learning/teaching style",	
			status: "Not Started",
		},
		{
			id: "3",
			title: "Mathematics Competency Exam",
			description: "A test to measure your cognitive ability",
			status: "Started",
			maxScore: 100
		},
		{
			id: "4",
			title: "English Language Exam",
			description: "A test to measure your English language proficiency",
			status: "Finished",
			score: 90,
			maxScore: 100,
			results: "Passed"
		},
		{
			id: "5",
			title: "Science Competency Exam",
			description: "A test to measure your scientific knowledge",
			status: "Finished",
			score: 20,
			maxScore: 100,
			results: "Failed"
		}
	]
  return (
	<div className="flex flex-row justify-center items-center">
		<div className="w-1/2 items-center text-center">
			<h1>Exams Page</h1>
			<div className="grid grid-cols-2 w-full gap-4 place-items-center">
				{sampleExams.map((exam) => (
				<ExamCard key={exam.id} {...exam} />
				))}
			</div>
			<Button onClick={() => router.push("/")}>
				Back to home
			</Button>
		</div>
	</div>

  );
}