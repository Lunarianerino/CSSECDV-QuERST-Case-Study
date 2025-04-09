
"use server";
import { Button } from "@/components/ui/button";
import ExamsList from "@/components/exams/ExamsList";
import Link from "next/link";
export default async function ExamsPage() {
	return (
		<main>
			<div className="flex flex-row justify-center items-center">
				<div className="w-3xl items-center text-center">
					<h1>Exams Page</h1>
					<ExamsList />
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