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
const ExamsList = () => {
  const [examList, setExamList] = useState<ExamListItem[]>([]);
  //TODO: loading state please
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    getExams().then((res) => {
      setExamList(res);
      setIsLoading(false);
    })
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {examList.map((exam, index) => (
          <TableRow key={index}>
            <TableCell>{exam.name}</TableCell>
            <TableCell>{exam.description}</TableCell>
            <TableCell>

              <Button>
                Edit
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Exam</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    Assign this exam to a user
                  </DialogDescription>
                  <UsersModal examId={exam.id} />
                  <DialogFooter className="sm:justify-start">
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ExamsList;