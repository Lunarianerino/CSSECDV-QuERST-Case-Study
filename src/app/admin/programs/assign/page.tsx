"use client";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover } from "@/components/ui/popover";
import { assignParticipantsToProgram, getPrograms, ProgramData, removeParticipantFromProgram } from "@/lib/actions/programActions";
import { getAllUsers } from "@/lib/actions/userActions";
import { BasicAccountInfo } from "@/types/accounts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table";
import { TrashIcon, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner";


const Page = () => {

    const participantSelectColumns: ColumnDef<BasicAccountInfo>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
        },
        {
            accessorKey: "email",
            header: "Email"
        },
        {
            accessorKey: "name",
            header: "Name"
        },
        {
            accessorKey: "type",
            header: "Type"
        },
    ];

    const participantColumns: ColumnDef<BasicAccountInfo>[] = [
        {
            accessorKey: "email",
            header: "Email"
        },
        {
            accessorKey: "name",
            header: "Name"
        },
        {
            accessorKey: "type",
            header: "Type"
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
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveUser(row.original.id)} disabled={isDeleting}>{isDeleting ? <Loader2 className="animate-spin" /> : "Continue"}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        }
    ];

    // Get the list of programs
    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [users, setUsers] = useState<BasicAccountInfo[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<BasicAccountInfo[]>([]);
    const [participants, setParticipants] = useState<BasicAccountInfo[]>([]);

    const [isAssignOpen, setAssignOpen] = useState(false);

    const { data: programsData, isLoading: isLoadingPrograms, isError: isErrorPrograms } = useQuery({
        queryKey: ['programs'],
        queryFn: getPrograms
    });

    const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers
    });

    useEffect(() => {
        if (programsData) {
            console.log("Programs data:", programsData);
            setPrograms(programsData.data || []);
        }
    }, [programsData]);

    useEffect(() => {
        if (usersData) {
            console.log("Users data:", usersData);
            setUsers(usersData || []);
        }
    }, [usersData]);

    useEffect(() => {
        if (selectedProgram) {
            setParticipants(users.filter(user => selectedProgram.participants.includes(user.id)) || []);
        }
    }, [selectedProgram, users]);

    const handleProgramSelect = (programId: string) => {
        const program = programs.find(p => p.id === programId) || null;
        setSelectedProgram(program);
    };

    const { mutateAsync: assignUsersToProgram, isPending: isAssigning, isError: isAssignError, isSuccess: isAssignSuccess, error: assignError } = useMutation({
        mutationFn: async ({ programId, userIds }: { programId: string, userIds: string[] }) => {
            const res = await assignParticipantsToProgram(programId, userIds);

            if (!res.success)
                throw new Error("Failed to assign users: " + res.error);

            return res;
        },
        onSuccess: () => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            setAssignOpen(false);
            setSelectedUsers([]);
        },
        onError: (error) => {
            console.error("Error assigning users:", error);
        }
    });

    const { mutateAsync: removeUserFromProgram, isPending: isDeleting, isError: isDeleteError, isSuccess: isDeleteSuccess, error: deleteError } = useMutation({
        mutationFn: async ({ programId, userId }: { programId: string, userId: string }) => {
            const res = await removeParticipantFromProgram(programId, userId);

            if (!res.success)
                throw new Error("Failed to remove user: " + res.error);

            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
        },
        onError: (error) => {
            console.error("Error removing user:", error);
        }
    });

    const handleAssignUsers = async () => {
        if (!selectedProgram || selectedUsers.length === 0) return;

        try {
            await assignUsersToProgram({ programId: selectedProgram.id, userIds: selectedUsers.map(u => u.id) });
        } catch (error) {
            console.error("Error assigning users:", error);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!selectedProgram) return;

        try {
            await removeUserFromProgram({ programId: selectedProgram.id, userId });
        } catch (error) {
            console.error("Error removing user:", error);
        }
    };

    const queryClient = useQueryClient();

    useEffect(() => {
        if (isAssignSuccess) {
            toast.success("Users assigned successfully!");
        }
    }, [isAssignSuccess]);

    useEffect(() => {
        if (!selectedProgram) return
        const updated = programs.find(p => p.id === selectedProgram.id) || null
        if (updated && updated !== selectedProgram) {
            setSelectedProgram(updated)
        }
    }, [programs]);

    useEffect(() => {
        if (isAssignError) {
            toast.error("Error assigning users: " + assignError.message);
        }
    }, [isAssignError]);

    useEffect(() => {
        if (isAssigning) {
            toast.loading("Assigning users...");
        }
    }, [isAssigning]);

    useEffect(() => {
        if (isDeleteSuccess) {
            toast.success("User removed successfully!");
        }
    }, [isDeleteSuccess]);

    useEffect(() => {
        if (deleteError) {
            toast.error("Error removing user: " + deleteError.message);
        }
    }, [deleteError]);

    useEffect(() => {
        if (isDeleting) {
            toast.loading("Removing user...");
        }
    }, [isDeleting]);

    return (
        <>

            <DashboardLayout title="Assign Users to Programs">
                <Combobox schema={programs.map(program => ({
                    value: program.id,
                    label: program.title
                }))}
                    value={selectedProgram?.id || ""}
                    onChange={handleProgramSelect}
                />

                {selectedProgram ?
                    <>
                        <DataTable columns={participantColumns} data={participants} />
                        <Button onClick={() => setAssignOpen(!isAssignOpen)}>Assign Users</Button>
                    </>
                    : (
                        <center>Please select a program to see the details.</center>
                    )}

            </DashboardLayout>

            <Dialog open={isAssignOpen} onOpenChange={setAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Assign Users to {selectedProgram?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <DataTable columns={participantSelectColumns} data={usersData?.filter(user => !selectedProgram?.participants.find(p => p === user.id)) || []} onSelectionChange={setSelectedUsers}></DataTable>
                    <DialogFooter>
                        <Button onClick={() => setAssignOpen(false)} variant="outline">Cancel</Button>
                        <Button onClick={handleAssignUsers} disabled={selectedUsers.length === 0 || isAssigning}>
                            {isAssigning && <Loader2 className="animate-spin" />}

                            {isAssigning ? "Assigning..." : "Assign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default Page;