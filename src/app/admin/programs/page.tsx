"use client";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { CalendarIcon, CheckIcon, ChevronDownIcon, Loader2, SquarePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProgramFormValues, programSchema } from "@/lib/validations/program";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProgram, getPrograms, ProgramData } from "@/lib/actions/programActions";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Page = () => {
    // List all programs
    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const { data: programsData, isLoading: isLoadingPrograms, isError: isErrorPrograms } = useQuery({
        queryKey: ['programs'],
        queryFn: getPrograms
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (programsData) {
            setPrograms(programsData.data || []);
        }
    }, [programsData]);

    // Function to add programs
    const form = useForm<ProgramFormValues>({
        resolver: zodResolver(programSchema),
        defaultValues: {
            title: "",
            description: "",
            startDate: undefined,
            endDate: undefined
        }
    });

    const handleOpenCreateProgram = () => {
        setIsCreateProgramOpen(true);
    };

    const { mutateAsync, isPending, isError, isSuccess, error } = useMutation({
        mutationKey: ['create-program'],
        mutationFn: async (data: ProgramFormValues) => {
            // Call your API to create the program
            console.log(data);
            const response = await createProgram(data);

            if (!response.success) {
                throw new Error(response.error || "Failed to create program");
            }
            return response;
        }
    });

    const onSubmit = async (data: ProgramFormValues) => {
        await mutateAsync(data);
    }
    // get Programs

    useEffect(() => {
        if (isError) {
            toast.error(error.message, {
                id: "create-program",
            });
        }
    }, [isError, error]);

    useEffect(() => {
        if (isSuccess) {
            toast.success("Program created successfully!", {
                id: "create-program",
            });
            form.reset();
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            setIsCreateProgramOpen(false);
        }
    }, [isSuccess]);

      const buttonText = useMemo(() => {
        if (isPending) {
          return 'Creating Program..';
        } else {
          return 'Create Program';
        }
      }, [isPending, isSuccess]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);
    const [newProgram, setNewProgram] = useState<{ title: string; description: string; startDate: Date | undefined; endDate: Date | undefined }>({ title: "", description: "", startDate: undefined, endDate: undefined });
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    return (
        <DashboardLayout title="Tutoring Programs">
            <Button onClick={handleOpenCreateProgram} disabled={isLoading}>
                <SquarePlus className="h-5 w-5" />
                Create Program
            </Button>
                {isLoadingPrograms ? (
                    <div className="flex flex-col items-center justify-center mt-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-lg font-medium text-primary">Loading programs...</p>
                    </div>
                ) : isErrorPrograms ? (
                    <div className="flex flex-col items-center justify-center mt-10">
                        <p className="mt-4 text-lg font-medium text-red-600">Failed to load programs. Please try again later.</p>
                    </div>
                ) : programs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-10">
                        <p className="mt-4 text-lg font-medium text-muted-foreground">No programs available. Create a new program to get started.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programs.map((program) => (
                                <TableRow key={program.id}>
                                    <TableCell className="font-medium">{program.title}</TableCell>
                                    <TableCell>{program.description}</TableCell>
                                    <TableCell>{program.startDate ? format(new Date(program.startDate), "PPP") : "N/A"}</TableCell>
                                    <TableCell>{program.endDate ? format(new Date(program.endDate), "PPP") : "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            <Dialog open={isCreateProgramOpen} onOpenChange={setIsCreateProgramOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Program</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new tutoring program.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Form fields for program creation */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Program Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Program Title"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Program Description</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Program Description"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <DatePickerForm open={startDateOpen} setOpen={setStartDateOpen} field={field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <DatePickerForm open={endDateOpen} setOpen={setEndDateOpen} field={field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">
                                    {isPending && <Loader2 className="animate-spin" />}
                                    {buttonText}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Page;
function DatePickerForm({ open, setOpen, field }) {
    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="outline"
                id="date"
                className="w-48 justify-between font-normal"
            >
                {field.value ? (
                    format(field.value, "PPP")
                ) : (
                    <span>Pick a date</span>
                )}
                <CalendarIcon />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
                mode="single"
                selected={field.value}
                captionLayout="dropdown"
                onSelect={field.onChange}

                disabled={(date) => date < new Date("1900-01-01")} />
        </PopoverContent>
    </Popover>;
}

