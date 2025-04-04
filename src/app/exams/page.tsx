
"use server";
import { Button } from "@/components/ui/button";
import ExamCard from "@/components/exams/ExamCard";
import getExams from "@/lib/queries/getExams";
import { redirect } from "next/navigation";
import Link from "next/link";
export default async function ExamsPage() {

	//TODO: Get exams specific to the user (assign exams to users)
	const exams = await getExams();
	console.log(exams);
	// const sampleExams = [
	// 	{
	// 		id: "1",
	// 		title: "Personality Exam",
	// 		description: "A test to measure your personality traits",
	// 		date: "2023-05-01",
	// 		status: "Finished",
	// 		results: "Not Graded"

	// 	},
	// 	{
	// 		id: "2",
	// 		title: "Learning/Teaching Style Exam",
	// 		description: "A test to determine your learning/teaching style",
	// 		status: "Not Started",
	// 	},
	// 	{
	// 		id: "3",
	// 		title: "Mathematics Competency Exam",
	// 		description: "A test to measure your cognitive ability",
	// 		status: "Started",
	// 		maxScore: 100
	// 	},
	// 	{
	// 		id: "4",
	// 		title: "English Language Exam",
	// 		description: "A test to measure your English language proficiency",
	// 		status: "Finished",
	// 		score: 90,
	// 		maxScore: 100,
	// 		results: "Passed"
	// 	},
	// 	{
	// 		id: "5",
	// 		title: "Science Competency Exam",
	// 		description: "A test to measure your scientific knowledge",
	// 		status: "Finished",
	// 		score: 20,
	// 		maxScore: 100,
	// 		results: "Failed"
	// 	}
	// ]
	return (
		<main>
			<div className="flex flex-row justify-center items-center">
				<div className="w-3xl items-center text-center">
					<h1>Exams Page</h1>
					<div className="grid grid-cols-2 w-full gap-4 place-items-center">
						{exams.map((exam) => (
							<ExamCard key={exam.id} {...exam} />
						))}
					</div>
					<Link href="/">
						<Button>
							Back to home
						</Button>
					</Link>
				</div>
			</div>
		</main>


	);
}