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
            endDate: program.endDate
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