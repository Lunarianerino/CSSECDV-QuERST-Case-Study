import {ProgramData, StudentWithExams} from "@/lib/actions/programActions";
import {useState} from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {ChevronDown, ChevronUp} from "lucide-react";

export function CollapsibleProgram({program, students}: { program: ProgramData, students: StudentWithExams[] }) {
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