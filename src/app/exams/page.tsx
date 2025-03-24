
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
			id: 1,
			title: "Personality Exam",
			description: "A test to measure your personality traits",
			date: "2023-05-01",
			status: "Finished"
		},
		{
			id: 2,
			title: "Learning/Teaching Style Exam",
			description: "A test to determine your learning/teaching style",	
			status: "Not Started"
		},
		{
			id: 3,
			title: "Mathematics Competency Exam",
			description: "A test to measure your cognitive ability",
			status: "Started"
		}
	]
  return (
    <div>
      <h1>Exams Page</h1>
			<Table>
				<TableCaption>The list of examinations</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date Started</TableHead>
						<TableHead>Date Finished</TableHead>
						<TableHead>Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sampleExams.map((exam) => (
						<TableRow key={exam.id}>
							<TableCell>{exam.title}</TableCell>
							<TableCell><StatusCircle status={exam.status} /></TableCell>
							<TableCell>{exam.date || "-"}</TableCell>
							<TableCell>Not finished</TableCell>
							<TableCell>
								<Button>{exam.status == "Not Started"}</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
      <Button onClick={() => router.push("/")}>
        Back to home
      </Button>
    </div>
  );
}