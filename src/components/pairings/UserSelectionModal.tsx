"use client";
import { useState, useEffect } from "react";
import { getTutorsAndStudentsAggregation } from "@/lib/actions/userActions";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";

type User = {
  _id: string;
  name: string;
  email: string;
};

type UserSelectionModalProps = {
  onSelectTutor: (tutor: User) => void;
  onSelectStudent: (student: User) => void;
  selectedTutor: User | null;
  selectedStudent: User | null;
};

const UserSelectionModal = ({
  onSelectTutor,
  onSelectStudent,
  selectedTutor,
  selectedStudent,
}: UserSelectionModalProps) => {
  const [tutors, setTutors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const result = await getTutorsAndStudentsAggregation();
        setTutors(result.tutors);
        setStudents(result.students);
        setError(null);
      } catch (err) {
        setError("Failed to load users. Please try again.");
        console.error("Error fetching users:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Convert tutors and students to the format expected by Combobox
  const tutorOptions = tutors.map((tutor) => ({
    value: tutor._id,
    label: `${tutor.name} (${tutor.email})`,
  }));

  const studentOptions = students.map((student) => ({
    value: student._id,
    label: `${student.name} (${student.email})`,
  }));

  const handleTutorSelect = (tutorId: string) => {
    const selectedTutor = tutors.find((tutor) => tutor._id === tutorId);
    if (selectedTutor) {
      onSelectTutor(selectedTutor);
      // console.log("Selected Tutor:", selectedTutor);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const selectedStudent = students.find((student) => student._id === studentId);
    if (selectedStudent) {
      onSelectStudent(selectedStudent);
      // console.log("Selected Student:", selectedStudent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tutor Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Tutor</label>
          {isLoading ? (
            <div className="text-center py-2">Loading tutors...</div>
          ) : error ? (
            <div className="text-center py-2 text-red-500">{error}</div>
          ) : (
            <Combobox
              schema={tutorOptions}
              value={selectedTutor?._id || ""}
              onChange={handleTutorSelect}
            />
          )}
        </div>

        {/* Student Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Student</label>
          {isLoading ? (
            <div className="text-center py-2">Loading students...</div>
          ) : error ? (
            <div className="text-center py-2 text-red-500">{error}</div>
          ) : (
            <Combobox
              schema={studentOptions}
              value={selectedStudent?._id || ""}
              onChange={handleStudentSelect}
            />
          )}
        </div>
      </div>

      {/* <div className="flex flex-col space-y-2">
        {selectedTutor && (
          <div className="text-sm">
            <span className="font-medium">Selected Tutor:</span> {selectedTutor.name}
          </div>
        )}
        {selectedStudent && (
          <div className="text-sm">
            <span className="font-medium">Selected Student:</span> {selectedStudent.name}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default UserSelectionModal;