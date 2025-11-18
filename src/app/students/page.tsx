/**
 * This page would be used to display the students assigned to a tutor.
 * For each student, the tutor would be able to view the student's performance for every exam.
 * The goal would be a card for each student that displays summarized information about the student (e.g. just their name and when they started the pairing).
 * Each card would contain an accordion that displays the student's performance for each exam.
 * The accordion would contain a summary of the student's performance for each exam (e.g. the number of questions they answered correctly, the number of questions they answered incorrectly, the number of questions they skipped).
 * The exams listed would be the exams that the tutor has assigned to the student. Each of these would be clickable and would redirect the tutor to the exam page for that exam.
 * The exams would be listed in order of when they were assigned to the student.
 */

"use client";

import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useRouter} from "next/navigation";
// import { getPairedStudentsAction } from "@/lib/actions/pairingActions";
import DashboardLayout from "@/components/dashboard-layout";
import {UserExamStatus} from "@/models/examStatus";
import {Progress} from "@/components/ui/progress";
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {getTutorPrograms, ProgramData, StudentWithExams} from "@/lib/actions/programActions";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {ChevronDown, ChevronUp, Loader2} from "lucide-react";


function CollapsibleProgram({ program, students }: { program: ProgramData, students: StudentWithExams[] }) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CollapsibleTrigger asChild>
					<CardHeader className="flex flex-row justify-between">
						<h1><b>{program.title}</b></h1>
						{isOpen ? (
							<ChevronUp/>
						) : (
							<ChevronDown/>
						)}
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent>
						<h2>{program.description}</h2>
						<h2>{program.startDate.toDateString()} - {program.endDate.toDateString()}</h2>
						<h2><b>Students:</b></h2>

						<ul className="list-disc list-inside">
							{students.map(
								(student) => {
									return (
										<li key={student.id}>
											{student.name} ({student.email})
										</li>
									);
								}
							)}
						</ul>
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>);
}

export default function StudentsPage() {
	const [students, setStudents] = useState<StudentWithExams[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const [isExamDetailsOpen, setIsExamDetailsOpen] = useState(false);
	const [activeStudent, setActiveStudent] = useState<StudentWithExams | undefined>(undefined)

	const [programs, setPrograms] = useState<ProgramData[]>([]);
	const {data: programsData, isLoading: isLoadingPrograms, isError: isErrorPrograms} = useQuery({
		queryKey: ['programs'],
		queryFn: getTutorPrograms
	});

	const queryClient = useQueryClient();

	useEffect(() => {
		if (programsData) {
			setPrograms(programsData.data || []);
			setStudents(programsData.students || []);
		}
	}, [programsData]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	};

	const handleExamClick = (examId: string) => {
		router.push(`/exams/grade/${examId}`);
	};

	const handleOpenExams = (matchId: string) => {
		//TODO: set what to display here
		setActiveStudent(students.find(student => student.matchId === matchId));
		// console.log(activeStudent);
		setIsExamDetailsOpen(true);
	}
	return (
		<DashboardLayout title="My Students">
			{isLoadingPrograms ? (
				<div className="flex flex-col items-center justify-center mt-10">
					<Loader2 className="h-8 w-8 animate-spin text-primary"/>
					<p className="mt-4 text-lg font-medium text-primary">Loading programs...</p>
				</div>
			) : isErrorPrograms ? (
				<div className="flex flex-col items-center justify-center mt-10">
					<p className="mt-4 text-lg font-medium text-red-600">Failed to load programs. Please try again later.</p>
				</div>
			) : programs.length === 0 ? (
				<div className="flex flex-col items-center justify-center mt-10">
					<p className="mt-4 text-lg font-medium text-muted-foreground">You are not assigned to any programs. If this is
						a mistake, contact support.</p>
				</div>
			) : (
				<>
					{programs.map((program) => {
						const programStudents = students.filter((s) => program.participants.includes(s.id));
						return (<CollapsibleProgram key={program.id} program={program} students={programStudents}/>);
					})}
				</>
			)

			}

			<Dialog open={isExamDetailsOpen} onOpenChange={setIsExamDetailsOpen}>
				<DialogContent className="!max-w-[100%] md:!max-w-[70%] lg:!max-w-[50%]">
					<DialogHeader>
						<DialogTitle>{activeStudent?.name}'s Exams</DialogTitle>
					</DialogHeader>

					{activeStudent && activeStudent.exams.length > 0 ? (
						activeStudent.exams.map(exam => (
							<Card key={exam.id} onClick={() => handleExamClick(exam.id)}>
								<CardHeader>
									<CardTitle>
										<div className="flex justify-between items-start mb-2">
											<div>
												<h4 className="font-medium">{exam.name}</h4>
												<p className="text-xs text-muted-foreground">
													{exam.status === UserExamStatus.FINISHED
														? `Completed on ${exam.completedAt ? formatDate(exam.completedAt) : 'Unknown date'}`
														: exam.status === UserExamStatus.STARTED
															? 'In progress'
															: 'Not started'}
												</p>
											</div>
											<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Attempt {exam.attemptNumber}
                    </span>
										</div>
									</CardTitle>
									<CardDescription>
										{exam.description}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{exam.status === UserExamStatus.FINISHED && (
										<div className="space-y-2">
											{exam.score !== undefined && exam.maxScore && (
												<div className="space-y-1">
													<div className="flex justify-between text-xs">
														<span>Score</span>
														<span>{exam.score} / {exam.maxScore}</span>
													</div>
													<Progress
														value={(exam.score / exam.maxScore) * 100}
														className="h-2"
													/>
												</div>
											)}

											{/* {exam.correctAnswers !== undefined && (
                        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                          <div className="flex flex-col items-center p-1 bg-green-100 rounded">
                            <span className="font-medium text-green-800">{exam.correctAnswers}</span>
                            <span className="text-green-700">Correct</span>
                          </div>
                          <div className="flex flex-col items-center p-1 bg-red-100 rounded">
                            <span className="font-medium text-red-800">{exam.incorrectAnswers}</span>
                            <span className="text-red-700">Incorrect</span>
                          </div>
                          <div className="flex flex-col items-center p-1 bg-gray-100 rounded">
                            <span className="font-medium text-gray-800">{exam.skippedAnswers}</span>
                            <span className="text-gray-700">Skipped</span>
                          </div>
                        </div>
                      )} */}
										</div>
									)}
								</CardContent>

							</Card>
						))
					) : (
						<p className="text-sm text-muted-foreground py-2">No exams assigned yet.</p>
					)}
				</DialogContent>

			</Dialog>
		</DashboardLayout>
	);
}
