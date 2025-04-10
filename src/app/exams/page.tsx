
"use server";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import ExamsList from "@/components/exams/ExamsList";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { SquarePlus } from "lucide-react";
export default async function ExamsPage() {
	return (
		<DashboardLayout title="View Exams">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row gap-4 mt-4">
						<CardTitle className="text-2xl">Exams</CardTitle>
						<Link href="/exams/create">
							<Button>
								<SquarePlus className="h-5 w-5" />
								Create Exam
							</Button>
						</Link>
					</div>
				</CardHeader>
				<CardContent>
				<ExamsList />

				</CardContent>

			</Card>
		</DashboardLayout>
	);
}