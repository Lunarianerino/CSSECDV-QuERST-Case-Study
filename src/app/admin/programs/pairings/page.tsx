"use client";
/*
    Pairings feature overhaul.
    Simpler. Will just be limited to program-specific pairings.
    No more global pairings.
    No more need for approval (removal of admin review).
    Pairings will be created and managed by program admins only.

    This will just contain two columns: one for tutors and one for students.
*/

import DashboardLayout from "@/components/dashboard-layout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPairing, getPrograms, ProgramData, removePairing } from "@/lib/actions/programActions";
import { getAllUsers } from "@/lib/actions/userActions";
import { AccountType } from "@/models/account";
import { BasicAccountInfo } from "@/types/accounts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, TrashIcon } from "lucide-react";
import { set } from "mongoose";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const Page = () => {

    interface Pairing {
        id: string;
        tutor?: BasicAccountInfo;
        student?: BasicAccountInfo;
    }

    const pairingColumns: ColumnDef<Pairing>[] = [
        {
            header: "Tutor",
            accessorKey: "tutor",
            cell: ({ row }) => (
                <HoverCard>
                    <HoverCardTrigger>
                        {(row.getValue("tutor") as BasicAccountInfo).name}
                    </HoverCardTrigger>
                    <HoverCardContent>
                        <p>{(row.getValue("tutor") as BasicAccountInfo).email}</p>
                    </HoverCardContent>
                </HoverCard>
            )
        },
        {
            header: "Student",
            accessorKey: "student",
            cell: ({ row }) => (
                <HoverCard>
                    <HoverCardTrigger>
                        {(row.getValue("student") as BasicAccountInfo).name}
                    </HoverCardTrigger>
                    <HoverCardContent>
                        <p>{(row.getValue("student") as BasicAccountInfo).email}</p>
                    </HoverCardContent>
                </HoverCard>
            )
        },
                {
            id: "delete",
            header: "Delete",
            cell: ({ row }) => (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline">
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will remove this participant from the program. This means that all their data in relation to this program will also be removed, such as their pairings.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemovePairing(row.original.id)} disabled={isRemoving}>{isRemoving ? <Loader2 className="animate-spin" /> : "Continue"}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        }
    ];

    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null);
    const [users, setUsers] = useState<BasicAccountInfo[]>([]);
    const [programParticipants, setProgramParticipants] = useState<BasicAccountInfo[]>([]);
    const [selectedTutor, setSelectedTutor] = useState<BasicAccountInfo | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<BasicAccountInfo | null>(null);
    const [isCreatePairingOpen, setCreatePairingOpen] = useState(false);
    const [pairings, setPairings] = useState<Pairing[]>([]);
    const queryClient = useQueryClient();
    const { data: programsData, isLoading: isLoadingPrograms, isError: isErrorPrograms } = useQuery({
        queryKey: ['programs'],
        queryFn: getPrograms
    });

    const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers
    });

    const { mutateAsync: createPairingAsync, isPending: isCreating, isError: isCreateError, isSuccess: isCreateSuccess, error: createError } = useMutation({
        mutationKey: ['createPairing'],
        mutationFn: async ({ programId, tutorId, studentId }: { programId: string; tutorId: string; studentId: string }) => {
            const res = await createPairing(programId, tutorId, studentId);

            if (!res.success) {
                throw new Error(res.error);
            }

            return res;
        },

        onSuccess: (data) => {
            // console.log("Pairing created successfully:", data);
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            setCreatePairingOpen(false);
        },

        onError: (error) => {
            // console.error("Error creating pairing:", error);
        }
    });

    const { mutateAsync: removePairingAsync, isPending: isRemoving, isError: isRemoveError, isSuccess: isRemoveSuccess, error: removeError } = useMutation({
        mutationKey: ['removePairing'],
        mutationFn: async ({ programId, pairingId }: { programId: string; pairingId: string }) => {
            const res = await removePairing(programId, pairingId);

            if (!res.success) {
                throw new Error(res.error);
            }

            return res;
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
        },

        onError: (error) => {

        }
    });

    // Refresh program data
    useEffect(() => {
        if (!selectedProgram) return
        const updated = programs.find(p => p.id === selectedProgram.id) || null
        if (updated && updated !== selectedProgram) {
            setSelectedProgram(updated)
        }
    }, [programs]);

    useEffect(() => {
        if (isCreateSuccess) {
            toast.success("Pairing created successfully", { id: "create_pairing" });
        }
    }, [isCreateSuccess]);

    useEffect(() => {
        if (isCreateError) {
            toast.error("Error creating pairing: " + createError.message, { id: "create_pairing" });
        }
    }, [isCreateError]);

    useEffect(() => {
        if (isCreating) {
            toast.loading("Creating pairing...", { id: "create_pairing" });
        }
    }, [isCreating]);

    useEffect(() => {
        if (isRemoving) {
            toast.loading("Removing pairing...", { id: "remove_pairing" });
        }
    }, [isRemoving]);

    useEffect(() => {
        if (isRemoveSuccess) {
            toast.success("Pairing removed successfully", { id: "remove_pairing" });
        }
    }, [isRemoveSuccess]);

    useEffect(() => {
        if (isRemoveError) {
            toast.error("Error removing pairing: " + removeError.message, { id: "remove_pairing" });
        }
    }, [isRemoveError]);

    const handleProgramSelect = (programId: string) => {
        const program = programs.find(p => p.id === programId) || null;
        setSelectedProgram(program);
    };

    const handleTutorSelect = (userId: string) => {
        const tutor = programParticipants.find(user => user.id === userId) || null;
        // console.log("Selected tutor:", tutor);
        setSelectedTutor(tutor);
    };

    const handleStudentSelect = (userId: string) => {
        const student = programParticipants.find(user => user.id === userId) || null;
        setSelectedStudent(student);
    };

    const handleCreatePairing = () => {
        if (selectedTutor && selectedStudent) {
            // Create pairing logic here
            // console.log("Creating pairing:", selectedTutor, selectedStudent);
            createPairingAsync({ programId: selectedProgram!.id, tutorId: selectedTutor.id, studentId: selectedStudent.id })
        }
    };

    const handleOpenCreatePairing = () => {
        setSelectedStudent(null);
        setSelectedTutor(null);
        setCreatePairingOpen(true);
    };

    const handleRemovePairing = async (pairingId: string) => {
        if (!selectedProgram) return;

        try {
            await removePairingAsync({ programId: selectedProgram.id, pairingId });
        } catch (error) {
            console.error("Error removing pairing:", error);
        }
    };
    useEffect(() => {
        if (programsData) {
            // console.log("Programs data:", programsData);
            setPrograms(programsData.data || []);
        }
    }, [programsData]);

    useEffect(() => {
        if (usersData) {
            // console.log("Users data:", usersData);
            setUsers(usersData || []);
        }
    }, [usersData]);

    useEffect(() => {
        if (selectedProgram) {
            const participants = users.filter(user => selectedProgram.participants.includes(user.id));
            setProgramParticipants(participants);

            const pairings = selectedProgram.pairings.map(p => ({
                id: p.id,
                tutor: users.find(u => u.id === p.tutor),
                student: users.find(u => u.id === p.student)
            }));
            setPairings(pairings);
        }
    }, [selectedProgram, users]);

    return (
        <>
            <DashboardLayout title="Program Pairings">
                <Combobox schema={programs.map(program => ({
                    value: program.id,
                    label: program.title
                }))}
                    value={selectedProgram?.id || ""}
                    onChange={handleProgramSelect}
                />


                {selectedProgram ?
                    <>
                        <Button onClick={handleOpenCreatePairing} className="my-4">
                            <Plus /> Create Pairing
                        </Button>
                        <DataTable columns={pairingColumns} data={pairings} />

                    </>
                    : (
                        <center>Please select a program to see the details.</center>
                    )}
            </DashboardLayout>

            <Dialog open={isCreatePairingOpen} onOpenChange={setCreatePairingOpen}>
                <DialogContent className="w-1/2">
                    <DialogHeader>
                        <DialogTitle>Create Pairing</DialogTitle>
                    </DialogHeader>
                    {/* Tutor */}
                    <div className="flex flex-row gap-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-md font-semibold">Select Tutor</h2>
                            <Combobox
                                schema={programParticipants.filter(u => u.type === AccountType.TUTOR).map(u => ({ value: u.id, label: u.name }))}
                                value={selectedTutor?.id || ""}
                                onChange={handleTutorSelect}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-md font-semibold">Select Student</h2>
                            <Combobox
                                schema={programParticipants.filter(u => u.type === AccountType.STUDENT).map(u => ({ value: u.id, label: u.name }))}
                                value={selectedStudent?.id || ""}
                                onChange={handleStudentSelect}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleCreatePairing} disabled={!selectedTutor || !selectedStudent}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
};

export default Page;