"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExamListItem, getExams } from "@/lib/actions/examActions";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import Link from "next/link";
import UsersModal from "./UsersModal";
import { Edit, UserPlus } from "lucide-react";
const ExamsList = () => {
  const [examList, setExamList] = useState<ExamListItem[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  //TODO: loading state please
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      const exams = await getExams();
      setExamList(exams);
      setIsLoading(false);
    }
    fetchExams();
  }, []);
  //TODO: LOADING STATE PLEASE
  if (isLoading) {
    return <div>Loading...</div>;
  }
  const handleAssignOpen = () => {
    setIsAssignOpen(true);
  }
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/6">Name</TableHead>
            <TableHead className="w-4/6">Description</TableHead>
            <TableHead className="w-1/6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No exams found
              </TableCell>
            </TableRow>
          ) : (
            examList.map((exam, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium truncate-cell">
                  {exam.name}
                </TableCell>
                <TableCell className="truncate-cell">
                  {exam.description}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={handleAssignOpen}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Exam: {exam.name}</DialogTitle>
                          <DialogDescription>
                            Select a user to assign this exam to
                          </DialogDescription>
                        </DialogHeader>
                        <UsersModal
                          examId={exam.id}
                          onClose={() => {
                            const dialogClose = document.querySelector('[data-radix-dialog-close]') as HTMLButtonElement;
                            dialogClose?.click();
                          }}
                        />
                        <DialogFooter className="sm:justify-start">
                          <DialogClose id="closeDialog">
                            <Button variant="outline" type="button">
                              Cancel
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
  // return (
  //   <Table className="overflow-hidden">
  //     <TableHeader>
  //       <TableRow>
  //         <TableHead>Name</TableHead>
  //         <TableHead>Description</TableHead>
  //         <TableHead>Actions</TableHead>
  //       </TableRow>
  //     </TableHeader>
  //     <TableBody>
  //       {examList.map((exam, index) => (
  //         <TableRow key={index}>
  //           <TableCell>{exam.name}</TableCell>
  //           <TableCell>{exam.description}</TableCell>
  //           <TableCell>

  //             <Button>
  //               Edit
  //             </Button>
  //             <Dialog>
  //               <DialogTrigger asChild>
  //                 <Button>
  //                   Assign
  //                 </Button>
  //               </DialogTrigger>
  //               <DialogContent>
  //                 <DialogHeader>
  //                   <DialogTitle>Assign Exam</DialogTitle>
  //                 </DialogHeader>
  //                 <DialogDescription>
  //                   Assign this exam to a user
  //                 </DialogDescription>
  //                 <UsersModal examId={exam.id} onClose={() => {
  //                   const dialogClose = document.querySelector('[data-radix-dialog-content] button[aria-label="Close"]') as HTMLButtonElement;
  //                   dialogClose?.click();
  //                 }} />
  //                 <DialogFooter className="sm:justify-start">
  //                   <DialogClose id="closeDialog"/>
  //                 </DialogFooter>
  //               </DialogContent>
  //             </Dialog>
  //           </TableCell>
  //         </TableRow>
  //       ))}
  //     </TableBody>
  //   </Table>
  // )
}

export default ExamsList;