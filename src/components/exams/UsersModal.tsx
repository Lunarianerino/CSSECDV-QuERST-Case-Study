"use client";
import { useState, useEffect } from "react";
import { getTutorsAndStudentsAggregation } from "@/lib/actions/userActions";
import { assignExamsToAll, assignExamToUserAction } from "@/lib/actions/examActions";
import { updateExamAttributesAction } from "@/lib/actions/updateExamAttributesAction";
import { getExamAttributesAction } from "@/lib/actions/getExamAttributesAction";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AccountType } from "@/models/account";
import { getUserPairings } from "@/lib/actions/pairingActions";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  _id: string;
  name: string;
  email: string;
};

type UsersModalProps = {
  examId?: string;
  onClose: () => void;
};

const UsersModal = ({ examId, onClose }: UsersModalProps) => {
  const { data: session } = useSession();
  // const [tutors, setTutors] = useState<User[]>([]);
  // const [students, setStudents] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignToAllStudents, setAssignToAllStudents] = useState(false);
  const [assignToAllTutors, setAssignToAllTutors] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [originalForStudents, setOriginalForStudents] = useState(false);
  const [originalForTutors, setOriginalForTutors] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.type === AccountType.ADMIN;
  const isTutor = session?.user?.type === AccountType.TUTOR;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch users based on role
        if (isAdmin) {
          // Admins can assign to any user
          const result = await getTutorsAndStudentsAggregation();
          setUsers([...result.tutors, ...result.students]);
        } else if (isTutor) {
          const result = await getUserPairings();
          const uniqueStudentsMap = new Map<string, { _id: string; name: string; email: string }>();
          for (const pairing of result) {
            const studentId = pairing.student.id;
            if (!uniqueStudentsMap.has(studentId)) {
              uniqueStudentsMap.set(studentId, {
                _id: studentId,
                name: pairing.student.name,
                email: pairing.student.email,
              });
            }
          }
          // const formattedResults = result.map((pairing) => {
          //   return {
          //     _id: pairing.student.id,
          //     name: pairing.student.name,
          //     email: pairing.student.email,
          //   };
          // });
          const formattedResults = Array.from(uniqueStudentsMap.values());
          // console.log(formattedResults);
          setUsers(formattedResults);
        } else {
          throw new Error("Unauthorized");
        }
        
        // Fetch exam attributes if examId is provided
        if (examId && isAdmin) {
          const examAttributes = await getExamAttributesAction(examId);
          if (examAttributes.success && examAttributes.data) {
            setAssignToAllStudents(examAttributes.data.forStudents);
            setAssignToAllTutors(examAttributes.data.forTutors);
            setOriginalForStudents(examAttributes.data.forStudents);
            setOriginalForTutors(examAttributes.data.forTutors);
            if (examAttributes.data.disabled == undefined || examAttributes.data.disabled == null) {
              setIsDisabled(false);
            } else {
              setIsDisabled(examAttributes.data.disabled);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId, isAdmin, isTutor]);

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

    try {
      setIsSubmitting(true);
      
      // If admin is updating group assignment settings
      if (isAdmin && (assignToAllStudents || assignToAllTutors)) {
        toast.loading("Updating exam group assignment settings...");
        const result = await updateExamAttributesAction(
          examId,
          assignToAllStudents,
          assignToAllTutors,
          isDisabled
        );
        
        if (result.success) {
          toast.success("Exam group assignment settings updated");
        } else {
          toast.error(result.message || "Failed to update exam settings");
        }

        if (originalForStudents !== assignToAllStudents || originalForTutors !== assignToAllTutors) {
          toast.loading("Assigning exam to all tutor and/or student users...");
          const result = await assignExamsToAll(assignToAllStudents, assignToAllTutors, examId);
          if (result.success) {
            toast.success("Exam assigned to all users successfully");
          } else {
            toast.error(result.message || "Failed to assign exam to all users");
          }
        }
      } 
      
      // If a specific user is selected, assign to that user
      if (selectedUserId) {
        toast.loading("Assigning exam to user...");
        const result = await assignExamToUserAction(examId, selectedUserId);
        
        if (result.success) {
          toast.success("Exam assigned to user successfully");
          setSelectedUserId(""); // Reset selection
        } else {
          toast.error(result.message || "Failed to assign exam to user");
        }
      } else if (!assignToAllStudents && !assignToAllTutors) {
        // If no user is selected and no group assignment is enabled
        toast.error("Please select a user or enable group assignment");
      }
    } catch (error) {
      console.error("Error assigning exam:", error);
      toast.error("Failed to assign exam");
    } finally {
      setIsSubmitting(false);
      onClose?.();

    }
  };

  const handleStudentsToggle = (checked: boolean) => {
    setAssignToAllStudents(checked);
  };

  const handleTutorsToggle = (checked: boolean) => {
    setAssignToAllTutors(checked);
  };

  const handleDisableToggle = (checked: boolean) => {
    setIsDisabled(checked);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select User</Label>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
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
          <div className="space-y-2">
            {isLoading ? (
              <>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="assign-students" 
                    checked={assignToAllStudents}
                    onCheckedChange={handleStudentsToggle}
                  />
                  <Label htmlFor="assign-students">Assign to all students</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="assign-tutors" 
                    checked={assignToAllTutors}
                    onCheckedChange={handleTutorsToggle}
                  />
                  <Label htmlFor="assign-tutors">Assign to all tutors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="disable-exam"
                    checked={isDisabled}
                    onCheckedChange={handleDisableToggle}
                  />
                  <Label htmlFor="disable-exam">Disable Exam</Label>
                </div>
              </>
            )}
          </div>
        )}

        <Button 
          onClick={handleAssignExam} 
          disabled={isLoading || isSubmitting}
          className="w-full"
        >
          {isLoading ? (
            <Skeleton className="h-5 w-20 mx-auto bg-primary-foreground/30" />
          ) : isSubmitting ? "Assigning..." : "Assign Exam"}
        </Button>
      </div>
    </div>
  );
};

export default UsersModal;