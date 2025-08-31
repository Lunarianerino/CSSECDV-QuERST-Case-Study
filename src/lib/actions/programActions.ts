"use server"
import { connectToMongoDB } from "../db";
import { Program } from "@/models";
import { ProgramFormValues } from "@/lib/validations/program";
import { authOptions } from "../auth";
import { getServerSession } from "next-auth";
import { AccountType } from "@/models/account";
import { MongoServerError } from "mongodb";

export interface ProgramsResponse {
    success: boolean;
    data?: ProgramData[];
    error?: string;
    status: number;
}

export interface ProgramData {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    participants: string[];
    pairings: { id: string; tutor: string; student: string }[];
}

// Get function
export const getPrograms = async (): Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const programs = await Program.find({});

        const processed_programs = programs.map((program) => ({
            id: program._id.toString(),
            title: program.title,
            description: program.description,
            startDate: program.startDate,
            endDate: program.endDate,
            participants: program.participants.map(x => x.toString()),
            pairings: program.pairings.map(x => ({
                id: x._id.toString(),
                tutor: x.tutor.toString(),
                student: x.student.toString()
            }))
        }));

        return {
            success: true,
            data: processed_programs,
            status: 200
        };
        
    } catch (error) {
        console.error("Error fetching programs:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
}

// Post function
export const createProgram = async (data: ProgramFormValues) : Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = new Program(data);
        await program.save();

        return {
            success: true,
            status: 200
        };
    } 
    catch (error) {
        if (error instanceof MongoServerError) {
            console.error("Error creating program:", error);
            if (error.code === 11000) {
                return {
                    success: false,
                    error: "Program with this title already exists",
                    status: 400
                };
            }

            return {
                success: false,
                error: error.message,
                status: 400
            };
        } else {
            return {
                success: false,
                error: "Internal Server Error",
                status: 500
            };
        }
    }
}

export const assignParticipantsToProgram = async (programId: string, userIds: string[]): Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = await Program.findById(programId);

        if (!program) {
            return {
                success: false,
                error: "Program not found",
                status: 404
            };
        }

        program.participants = [...new Set([...program.participants.map(id => id.toString()), ...userIds])];
        await program.save();

        return {
            success: true,
            status: 200
        };
    } catch (error) {
        console.error("Error assigning participants:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};

export const removeParticipantFromProgram = async (programId: string, userId: string): Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = await Program.findById(programId);

        if (!program) {
            return {
                success: false,
                error: "Program not found",
                status: 404
            };
        }

        program.participants = program.participants.filter(id => id.toString() !== userId);
        await program.save();

        return {
            success: true,
            status: 200
        };
    } catch (error) {
        console.error("Error removing participant:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};

export const createPairing = async (programId: string, tutorId: string, studentId: string): Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = await Program.findById(programId);

        if (!program) {
            return {
                success: false,
                error: "Program not found",
                status: 404
            };
        }

        program.pairings.push({ tutor: tutorId, student: studentId });
        await program.save();

        return {
            success: true,
            status: 200
        };
    } catch (error) {
        console.error("Error creating pairing:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};

export const removePairing = async (programId: string, pairingId: string): Promise<ProgramsResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = await Program.findById(programId);

        if (!program) {
            return {
                success: false,
                error: "Program not found",
                status: 404
            };
        }

        program.pairings = program.pairings.filter(pairing => pairing.id !== pairingId);
        await program.save();

        return {
            success: true,
            status: 200
        };
    } catch (error) {
        console.error("Error removing pairing:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};
