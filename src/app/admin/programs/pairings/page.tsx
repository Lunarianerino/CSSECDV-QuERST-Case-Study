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
import { createPairing, getPrograms, PairingOptions, PairingSuggestion, ProgramData, removePairing, suggestPairings } from "@/lib/actions/programActions";
import { getAllUsers } from "@/lib/actions/userActions";
import { AccountType } from "@/models/account";
import { BasicAccountInfo } from "@/types/accounts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, StarsIcon, TrashIcon } from "lucide-react";
import { set } from "mongoose";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
                                This action cannot be undone. This will remove this pairing from the program.
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
    const suggestPairingColumns: ColumnDef<PairingSuggestion>[] = [
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
            header: "Tutor",
            accessorKey: "tutorId",
            cell: ({ row }) => (
                <HoverCard>
                    <HoverCardTrigger>
                        {getBasicAccountInfo(row.getValue("tutorId")!)?.name ?? "--"}
                    </HoverCardTrigger>
                    <HoverCardContent>
                        <p>{getBasicAccountInfo(row.getValue("tutorId")!)?.email ?? "--"}</p>
                    </HoverCardContent>
                </HoverCard>
            )
        },
        {
            header: "Student",
            accessorKey: "studentId",
            cell: ({ row }) => (
                <HoverCard>
                    <HoverCardTrigger>
                        {getBasicAccountInfo(row.getValue("studentId")!)?.name ?? "--"}
                    </HoverCardTrigger>
                    <HoverCardContent>
                        <p>{getBasicAccountInfo(row.getValue("studentId")!)?.email ?? "--"}</p>
                    </HoverCardContent>
                </HoverCard>
            )
        },
        {
            header: "Similarity",
            accessorKey: "similarity",
            cell: ({ row }) => (
                row.getValue("similarity") ? parseFloat(row.getValue("similarity")!).toFixed(2) : "--"
            )
        },
        {
            header: "Reason",
            accessorKey: "reason",
            cell: ({ row }) => (
                row.getValue("reason") ? (row.getValue("reason")!) : "--"
            )
        }
    ];

    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null);
    const [users, setUsers] = useState<BasicAccountInfo[]>([]);
    const [programParticipants, setProgramParticipants] = useState<BasicAccountInfo[]>([]);
    const [selectedTutor, setSelectedTutor] = useState<BasicAccountInfo | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<BasicAccountInfo | null>(null);

    const [pairingSuggestions, setPairingSuggestions] = useState<PairingSuggestion[]>([]);
    const [pairingOptions, setPairingOptions] = useState<PairingOptions>({});

    const [isCreatePairingOpen, setCreatePairingOpen] = useState(false);
    const [isSuggestPairingsOpen, setSuggestPairingsOpen] = useState(false);
    const [isPairingOptionsOpen, setPairingOptionsOpen] = useState(false);

    const [pairings, setPairings] = useState<Pairing[]>([]);

    const [loading, setLoading] = useState(false);

    const queryClient = useQueryClient();
    const { data: programsData, isLoading: isLoadingPrograms, isError: isErrorPrograms } = useQuery({
        queryKey: ['programs'],
        queryFn: getPrograms
    });

    const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
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

    const { mutateAsync: suggestPairingsAsync, isPending: isSuggesting, isError: isSuggestError, isSuccess: isSuggestSuccess, error: suggestError } = useMutation({
        mutationKey: ['suggestPairings'],
        mutationFn: async (programId: string) => {
            const res = await suggestPairings(programId, pairingOptions);

            if (!res.success) {
                throw new Error(res.error);
            }

            return res;
        },

        onSuccess: (result) => {
            setPairingSuggestions(result.data || []);
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

    const getBasicAccountInfo = (id: string): BasicAccountInfo | undefined => {
        return users.find(u => u.id === id);
    };

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

    const handleOpenSuggestPairings = () => {
        setPairingOptionsOpen(false);
        setSuggestPairingsOpen(true);
        if (selectedProgram) {
            suggestPairingsAsync(selectedProgram.id);
        }
    };

    const handleOpenPairingOptions = () => {
        setPairingOptionsOpen(true);
    };

    const handleRemovePairing = async (pairingId: string) => {
        if (!selectedProgram) return;

        try {
            await removePairingAsync({ programId: selectedProgram.id, pairingId });
        } catch (error) {
            console.error("Error removing pairing:", error);
        }
    };

    const handleAcceptPairings = async () => {
        if (!selectedProgram) return;

        setLoading(true);
        //TODO
    };
    useEffect(() => {
        if (programsData) {
            // console.log("Programs data:", programsData);
            setPrograms(programsData.data || []);
        }
    }, [programsData]);

    useEffect(() => {
        const asyncAssignUsers = async () => {
            setLoading(true);
            if (usersData) {
                // console.log("Users data:", usersData);
                await setUsers(usersData || []);
            }
            setLoading(false);
        };
        asyncAssignUsers();
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
                {isLoadingPrograms || isLoadingUsers ? <Loader2 className="animate-spin" /> : isErrorPrograms || isErrorUsers ? <div>Error loading data.</div> :
                    <>
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
                                <Button onClick={handleOpenPairingOptions} className="my-4 mx-4">
                                    <StarsIcon /> Suggest Pairings
                                </Button>
                                <DataTable columns={pairingColumns} data={pairings} />

                            </>
                            : (
                                <center>Please select a program to see the details.</center>
                            )}
                    </>
                }
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

            <Dialog open={isSuggestPairingsOpen} onOpenChange={setSuggestPairingsOpen}>
                <DialogContent className="min-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Suggest Pairings</DialogTitle>
                    </DialogHeader>
                    {isSuggesting ?
                        <center><Loader2 className="animate-spin" /></center>
                        : pairingSuggestions.length === 0 ? <div>No suggestions available.</div>
                            : <div className="flex flex-col gap-4 min-w-0">
                                <DataTable columns={suggestPairingColumns} data={pairingSuggestions} />
                            </div>
                    }
                    <DialogFooter>
                        {!isSuggesting && pairingSuggestions.length > 0 &&
                            <Button onClick={handleAcceptPairings} disabled={!selectedProgram || loading}>{loading ? <Loader2 className="animate-spin" /> : "Accept All"}</Button>
                        }

                        {/* <Button onClick={handleSuggestPairings} disabled={!selectedProgram}>Suggest</Button> */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPairingOptionsOpen} onOpenChange={setPairingOptionsOpen}>
                <DialogContent className="w-1/3">
                    <DialogHeader>
                        <DialogTitle>Pairing Options</DialogTitle>
                    </DialogHeader>
                    {/* Options form */}
                    <div className="flex flex-col gap-4">
                        {/* <div className="flex flex-col">
                            <label className="mb-2 font-semibold">Max Students per Tutor</label>
                            <Input type="number" min={1} className="border border-gray-300 rounded px-2 py-1" value={pairingOptions.maxStudentsPerTutor || ""} onChange={(e) => setPairingOptions(prev => ({ ...prev, maxStudentsPerTutor: e.target.value ? parseInt(e.target.value) : undefined }))} />
                        </div> */}

                        <div className="flex flex-col">
                            <label className="mb-2 font-semibold">BFI</label>
                            <Switch checked={pairingOptions.bfi?.enabled} onCheckedChange={(checked) => setPairingOptions(prev => ({ ...prev, bfi: { ...prev.bfi, enabled: checked } }))} />
                        </div>
                        {pairingOptions.bfi?.enabled &&
                            <div className="flex flex-col gap-2 ml-4">
                                <div className="flex flex-col">
                                    <label className="mb-2 font-semibold">Weight</label>
                                    <Input type="number" min={0} max={100} step={1} className="border border-gray-300 rounded px-2 py-1" value={pairingOptions.bfi?.weight || ""} onChange={(e) => setPairingOptions(prev => ({ ...prev, bfi: { ...prev.bfi, weight: e.target.value ? parseFloat(e.target.value) : 1 } }))} />
                                </div>
                            </div>
                        }

                        <div className="flex flex-col">
                            <label className="mb-2 font-semibold">VARK</label>
                            <Switch checked={pairingOptions.vark?.enabled} onCheckedChange={(checked) => setPairingOptions(prev => ({ ...prev, vark: { ...prev.vark, enabled: checked } }))} />
                        </div>
                        {pairingOptions.vark?.enabled &&
                            <div className="flex flex-col gap-2 ml-4">
                                <div className="flex flex-col">
                                    <label className="mb-2 font-semibold">Weight</label>
                                    <Input type="number" min={0} max={100} step={1} className="border border-gray-300 rounded px-2 py-1" value={pairingOptions.vark?.weight || ""} onChange={(e) => setPairingOptions(prev => ({ ...prev, vark: { ...prev.vark, weight: e.target.value ? parseFloat(e.target.value) : 1 } }))} />
                                </div>
                            </div>
                        }
                    </div>
                    <DialogFooter>
                        <Button onClick={handleOpenSuggestPairings} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Suggest Pairing"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Page;