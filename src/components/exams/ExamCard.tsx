"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import StatusCircle from "./StatusCircle";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

import { useState } from "react";
import { UserExamStatus } from "@/models/examStatus";
import { setStartedExamStatusAction } from "@/lib/actions/examActions";
interface ExamCardProps {
    id: string;
    name: string;
    description: string;
    date?: string;
    status: UserExamStatus;
    score?: number;
    maxScore?: number;
    results?: string;
    attemptNumber?: number;
}

const ExamCard: React.FC<ExamCardProps> = ({
    id,
    name,
    description,
    date,
    status,
    score,
    maxScore,
    results,
    attemptNumber
}) => {
    const [open, setOpen] = useState(false);

    const handleExamClick = () => {
        // Handle exam click
        console.log(`Exam ${id} clicked`);
        setOpen(true);
    }

    const handleTakeExamClick = async () => {
        // Handle take exam click
        if (id) {
            // await setStartedExamStatusAction(id, attemptId);
            // console.log(`Take Exam ${id} attempt ${attemptNumber} clicked`);
            setOpen(false);
            window.location.href = `/exam/${id}`;
        } else {
            console.error("No attempt ID available");
        }
    }

    return (
        <>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow w-96 h-52 text-center" onClick={handleExamClick}>
                <CardHeader>
                    <CardTitle>{name}</CardTitle>
                    {attemptNumber && <div className="text-xs text-gray-500 mt-1">Attempt {attemptNumber}</div>}
                </CardHeader>
                <CardContent>
                    <CardDescription>{description}</CardDescription>
                </CardContent>
                <CardFooter>
                    <div className="flex flex-row w-full justify-center gap-12">
                        <div className="flex flex-col justify-between items-center">
                            <div className="text-sm text-gray-500">Results</div>
                            {status === UserExamStatus.FINISHED ? (
                                <>
                                    <div className="text-sm font-semibold">{results}</div>
                                    {results !== "Not Graded" && (
                                        <div className="text-sm font-semibold">{score} / {maxScore}</div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-sm font-semibold">N/A</div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="text-sm text-gray-500">Status</div>
                            <div className="text-sm font-semibold">
                                <StatusCircle status={status} />
                            </div>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{name}</AlertDialogTitle>
                        {attemptNumber && <div className="text-sm text-gray-500 mb-2">Attempt {attemptNumber}</div>}
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                        <div className="mt-4">
                            <div><strong>Status:</strong> {status}</div>
                            {status === UserExamStatus.FINISHED && (
                                <>
                                    <div><strong>Results:</strong> {results}</div>
                                    {results !== "Not Graded" && (
                                        <div><strong>Score:</strong> {score} / {maxScore}</div>
                                    )}
                                </>
                            )}
                            {date && <div><strong>Date:</strong> {date}</div>}
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {/* {status === UserExamStatus.FINISHED && (
                            <>
                                <AlertDialogAction>View Results</AlertDialogAction>
                                <AlertDialogAction>Retake Exam</AlertDialogAction>
                            </>                        )} */}
                        {status === UserExamStatus.STARTED && (
                            <AlertDialogAction onClick={handleTakeExamClick}>Continue Exam</AlertDialogAction>
                        )}
                        {status === UserExamStatus.NOT_STARTED && (
                            <AlertDialogAction onClick={handleTakeExamClick}>Start Exam</AlertDialogAction>
                        )}
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default ExamCard;