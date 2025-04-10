"use client";
import { useState, useEffect } from "react";
import { getTutorsAndStudentsAggregation } from "@/lib/actions/userActions";
import { assignExamToUserAction } from "@/lib/actions/examActions";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AccountType } from "@/models/account";
import { getUserPairings } from "@/lib/actions/pairingActions";

type User = {
  _id: string;
  name: string;
  email: string;
};

type UsersModalProps = {
  examId?: string;
};

const UsersModal = ({ examId }: UsersModalProps) => {
  const { data: session } = useSession();
  // const [tutors, setTutors] = useState<User[]>([]);
  // const [students, setStudents] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [autoAssignNewUsers, setAutoAssignNewUsers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.type === AccountType.ADMIN;
  const isTutor = session?.user?.type === AccountType.TUTOR;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        if (isAdmin) {
          // Admins can assign to any user
          const result = await getTutorsAndStudentsAggregation();
          setUsers([...result.tutors, ...result.students]);
        } else if (isTutor) {
          const result = await getUserPairings();
          const formattedResults = result.map((pairing) => {
            return {
              _id: pairing.student.id,
              name: pairing.student.name,
              email: pairing.student.email,
            };
          });
          setUsers(formattedResults);
        } else {
          throw new Error("Unauthorized");
        }
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

  // // Prepare user options for the combobox based on user role
  // const userOptions = (() => {
  //   if (isAdmin) {
  //     // Admins can assign to any user
  //     return [...tutors, ...students].map((user) => ({
  //       value: user._id,
  //       label: `${user.name}`,
  //       email: user.email,
  //     }));
  //   } else if (isTutor) {
  //     // Tutors can only assign to students
  //     return students.map((student) => ({
  //       value: student._id,
  //       label: `${student.name}`,
  //       email: student.email,
  //     }));
  //   }
  //   return [];
  // })();
  const userOptions = users.map((user) => ({
    value: user._id,
    label: `${user.name}`,
    email: user.email,
  }));
  const handleAssignExam = async () => {
    if (!examId) {
      toast.error("No exam selected");
      return;
    }

    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await assignExamToUserAction(examId, selectedUserId);
      
      if (result.success) {
        toast.success("Exam assigned successfully");
        setSelectedUserId(""); // Reset selection
      } else {
        toast.error(result.message || "Failed to assign exam");
      }
    } catch (error) {
      console.error("Error assigning exam:", error);
      toast.error("Failed to assign exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Implement auto-assign functionality when the API is available
  const handleAutoAssignToggle = (checked: boolean) => {
    setAutoAssignNewUsers(checked);
    // This would need to call an API to set a flag in the database
    toast.info(checked ? "Auto-assign enabled" : "Auto-assign disabled");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select User</Label>
          {isLoading ? (
            <div className="text-center py-2">Loading users...</div>
          ) : error ? (
            <div className="text-center py-2 text-red-500">{error}</div>
          ) : (
            <Combobox
              schema={userOptions}
              value={selectedUserId}
              onChange={setSelectedUserId}
            />
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-assign" 
              checked={autoAssignNewUsers}
              onCheckedChange={handleAutoAssignToggle}
            />
            <Label htmlFor="auto-assign">Automatically assign to new users</Label>
          </div>
        )}

        <Button 
          onClick={handleAssignExam} 
          disabled={!selectedUserId || isSubmitting || isLoading}
          className="w-full"
        >
          {isSubmitting ? "Assigning..." : "Assign Exam"}
        </Button>
      </div>
    </div>
  );
};

export default UsersModal;