"use server"
import { connectToMongoDB } from "../db";
import { Program, SpecialExam } from "@/models";
import { ProgramFormValues } from "@/lib/validations/program";
import { authOptions } from "../auth";
import { getServerSession } from "next-auth";
import { AccountType } from "@/models/account";
import { MongoServerError } from "mongodb";
import { ExamTags } from "@/models/specialExam";
import { BfiResultResponse, getBfiResultsAction } from "./bfiActions";
import { getVarkResultsAction, VarkResultResponse } from "./varkActions";

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
export const createProgram = async (data: ProgramFormValues): Promise<ProgramsResponse> => {
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

type ToggleWeight = {
    enabled?: boolean;
    weight?: number;
};

export type PairingOptions = {
    maxStudentsPerTutor?: number;
    bfi?: ToggleWeight;
    vark?: ToggleWeight;
};

const defaultOptions = {
    bfi: { enabled: true, weight: 1 },
    vark: { enabled: true, weight: 1 },
} as const;

export interface PairingSuggestion {
    matched: boolean;
    tutorId?: string | null;
    studentId?: string | null;
    similarity?: number | null;
    reason?: string | null;
}

interface VariableResults {
    id: string;
    bfiResults: BfiResultResponse | null;
    varkResults: VarkResultResponse | null;
}

export interface SuggestPairingsResponse {
    success: boolean;
    data?: PairingSuggestion[];
    error?: string;
    status: number;
}

export interface SuggestSimilarityResponse {
    success: boolean;
    data?: PairingSuggestion;
    error?: string;
    status: number;
}
export const suggestPairings = async (programId: string, options: PairingOptions = {}): Promise<SuggestPairingsResponse> => {
    try {
        options = getPairingOptions(options)

        console.log("Suggesting pairings with options:", options);

        const session = await getServerSession(authOptions);

        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }

        await connectToMongoDB();
        const program = await Program.findById(programId).populate({
            path: "participants",
            model: "Account",
            select: "_id type"
        });

        if (!program) {
            return {
                success: false,
                error: "Program not found",
                status: 404
            };
        }

        // Implement your pairing suggestion logic here
        console.log(program);

        // Step 1: Retrieve user accounts
        const userAccounts = program.participants;

        // Step 2: Retrieve the BFI and VARK
        const specialExams = await SpecialExam.find({});

        const VARKExam = specialExams.find((exam) => exam.tag.includes(ExamTags.VARK));
        const BFIExam = specialExams.find((exam) => exam.tag.includes(ExamTags.BFI));

        if (!VARKExam || !BFIExam) {
            return {
                success: false,
                error: "VARK or BFI exam not found",
                status: 404
            };
        }

        // Step 3: Iterate through each participant
        const tutors = userAccounts.filter(user => user.type === AccountType.TUTOR);
        const students = userAccounts.filter(user => user.type === AccountType.STUDENT);

        // Step 4: Get BFI and VARK results of each tutor and student
        let tutorList: VariableResults[] = []
        let studentList: VariableResults[] = []

        let pairingResults: PairingSuggestion[] = []

        for (const tutor of tutors) {
            tutorList.push(
                await getParticipantResults(tutor._id.toString(), options)
            );
        }
        
        for (const student of students) {
            studentList.push(
                await getParticipantResults(student._id.toString(), options)
            );
        }

        //TODO: Sort the students by grades (worst to best)
        //TODO: Tutor pairing limit

        // Clean tutor results (remove invalid tutors with errors)
        for (const tutor of tutorList) {
            const {valid, reasons} = cleanParticipantResults(tutor, options, "tutor");
            
            if (!valid) {
                pairingResults.push({
                    matched: !valid,
                    tutorId: tutor.id.toString(),
                    studentId: null,
                    similarity: null,
                    reason: reasons.join("; ")
                });
                console.log("Removing tutor due to error:", tutor.id, reasons.join("; "));
                tutorList = tutorList.filter(t => t.id !== tutor.id);
            }
        }

        // Clean student results (remove invalid students with errors)
        for (const student of studentList) {
            const { valid, reasons } = cleanParticipantResults(student, options, "student");

            if (!valid) {
                pairingResults.push({
                    matched: !valid,
                    tutorId: null,
                    studentId: student.id.toString(),
                    similarity: null,
                    reason: reasons.join("; ")
                });
                console.log("Removing student due to error:", student.id, reasons.join("; "));
                studentList = studentList.filter(s => s.id !== student.id);
            }
        }
        console.log(studentList);

        for (const student of studentList) {
            // Initial check: If tutor list is empty, let's not waste time
            if (tutorList.length <= 0) {
                pairingResults.push({
                    matched: false,
                    tutorId: null,
                    studentId: student.id.toString(),
                    similarity: null,
                    reason: "No available tutors"
                });
                continue;
            }

            const studentVector = vectorizeResults(student, options);
            let potentialMatches: { tutorId: string; similarity: number }[] = [];

            //! This section forward is completely untested
            for (const tutor of tutorList) {
                const tutorVector = vectorizeResults(tutor, options);
                const similarity = calculateSimilarity(tutorVector, studentVector);
                potentialMatches.push({ tutorId: tutor.id, similarity });
            }
            potentialMatches.sort((a, b) => b.similarity - a.similarity);
            console.log("Potential Matches for student", student.id, potentialMatches);

            // Select the top 1, if available.
            if (potentialMatches.length > 0) {
                const bestMatch = potentialMatches[0];
                pairingResults.push({
                    matched: true,
                    tutorId: bestMatch.tutorId.toString(),
                    studentId: student.id.toString(),
                    similarity: bestMatch.similarity,
                    reason: null
                });

                //? This would be a good section to implement tutor pair limit logic.
                // Remove the matched tutor from the list
                tutorList = tutorList.filter(t => t.id !== bestMatch.tutorId);
            } else {
                // Unlikely, but just in case
                pairingResults.push({
                    matched: false,
                    tutorId: null,
                    studentId: student.id.toString(),
                    similarity: null,
                    reason: "No suitable tutor found"
                });
            }
        }

        return {
            success: true,
            data: pairingResults,
            status: 200
        };
    } catch (error) {
        console.error("Error suggesting pairings:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};

export const confirmSuggestedPairings = async (programId: string, pairings: PairingSuggestion[]): Promise<ProgramsResponse> => {
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

        // Filter out invalid pairings
        const validPairings = pairings.filter(p => p.matched && p.tutorId && p.studentId);

        // Add new pairings to the program
        for (const pairing of validPairings) {
            // Avoid duplicates
            const exists = program.pairings.some(p => p.tutor.toString() === pairing.tutorId && p.student.toString() === pairing.studentId);
            if (!exists) {
                program.pairings.push({ tutor: pairing.tutorId!, student: pairing.studentId! });
            }
        }

        await program.save();

        return {
            success: true,
            status: 200
        };
    } catch (error) {
        console.error("Error confirming pairings:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
};
export const getSimilarity = async (tutorId: string, studentId: string, options: PairingOptions = {}): Promise<SuggestSimilarityResponse> => {
    try {
        options = getPairingOptions(options);
        console.log("Calculating similarity with options:", options);

        const session = await getServerSession(authOptions);
        
        if (!session || session.user?.type !== AccountType.ADMIN) {
            return {
                success: false,
                error: "Unauthorized",
                status: 401
            }
        }
        
        await connectToMongoDB();
        const pairingSuggestion: PairingSuggestion = {
            matched: true,
            tutorId,
            studentId,
            similarity: null,
            reason: null
        };
        const tutorResults = await getParticipantResults(tutorId, options);
        const studentResults = await getParticipantResults(studentId, options);

        const tutorClean = cleanParticipantResults(tutorResults, options, "tutor");
        const studentClean = cleanParticipantResults(studentResults, options, "student");

        if (!tutorClean.valid || !studentClean.valid) {
            pairingSuggestion.matched = false;
            pairingSuggestion.similarity = null;
            pairingSuggestion.reason = (!tutorClean.valid ? `Tutor results invalid: [${tutorClean.reasons.join("; ")}]` : "") +
                (!tutorClean.valid && !studentClean.valid ? " | " : "") +
                (!studentClean.valid ? `Student results invalid: [${studentClean.reasons.join("; ")}]` : "");
            return {
                success: false,
                error: pairingSuggestion.reason,
                status: 400,
                data: pairingSuggestion
            };
        }

        const tutorVector = vectorizeResults(tutorResults, options);
        const studentVector = vectorizeResults(studentResults, options);

        console.log("Tutor Vector:", tutorVector);
        console.log("Student Vector:", studentVector);
        
        const similarity = calculateSimilarity(tutorVector, studentVector);

        pairingSuggestion.similarity = similarity;

        return {
            success: true,
            data: pairingSuggestion,
            status: 200
        };
    } catch (error) {
        console.error("Error calculating similarity:", error);
        return {
            success: false,
            error: "Internal Server Error",
            status: 500
        };
    }
}


/**
 * Calculates the cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns A value between -1 and 1, where 1 means identical
 * @source https://alexop.dev/posts/how-to-implement-a-cosine-similarity-function-in-typescript-for-vector-comparison/
 */
function calculateSimilarity(vecA: number[], vecB: number[]): number {
    // Cosine Similarity
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have the same dimensions");
    }

    // Calculate dot product: A·B = Σ(A[i] * B[i])
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);

    // Calculate magnitudes using Math.hypot()
    const magnitudeA = Math.hypot(...vecA);
    const magnitudeB = Math.hypot(...vecB);

    // Check for zero magnitude
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    // Calculate cosine similarity: (A·B) / (|A|*|B|)
    return dotProduct / (magnitudeA * magnitudeB);
}

function vectorizeResults(participant: VariableResults, options: PairingOptions): number[] {
    const vector: number[] = [];
    if (options.vark?.enabled && participant.varkResults?.data) {
        const varkWeight = options.vark.weight ?? 1;
        //? Normalize?
        vector.push(
            participant.varkResults.data.Visual * varkWeight,
            participant.varkResults.data.Auditory * varkWeight,
            participant.varkResults.data["Read/Write"] * varkWeight,
            participant.varkResults.data.Kinesthetic * varkWeight
        );
    }
    // Push other results (e.g., BFI) into the vector
    if (options.bfi?.enabled && participant.bfiResults?.data) {
        const bfiWeight = options.bfi.weight ?? 1;
        //? Normalize?
        vector.push(
            participant.bfiResults.data.Openness * bfiWeight,
            participant.bfiResults.data.Conscientiousness * bfiWeight,
            participant.bfiResults.data.Extroversion * bfiWeight,
            participant.bfiResults.data.Agreeableness * bfiWeight,
            participant.bfiResults.data.Neuroticism * bfiWeight
        );
    }


    return vector;
}

function getPairingOptions(options: PairingOptions) {
    const merged: PairingOptions = {
        maxStudentsPerTutor: options.maxStudentsPerTutor ?? 1, //! Not yet implemented
        bfi: { ...defaultOptions.bfi, ...options.bfi },
        vark: { ...defaultOptions.vark, ...options.vark },
    };
    return merged;
}

async function getParticipantResults(participantId: string, options: PairingOptions): Promise<VariableResults> {

    const results: VariableResults = {
        id: participantId,
        varkResults: null,
        bfiResults: null
    };

    try {
        results.bfiResults = options.bfi?.enabled ? await getBfiResultsAction(participantId) : null;
    } catch (error) {
        console.error("Error getting BFI results for participant:", participantId, error);
        results.bfiResults = null;
    }

    try {
        results.varkResults = options.vark?.enabled ? await getVarkResultsAction(participantId) : null;
    } catch (error) {
        console.error("Error getting VARK results for participant:", participantId, error);
        results.varkResults = null;
    }

    return results;
}

function cleanParticipantResults(participant: VariableResults, options: PairingOptions, participant_type: string): { valid: boolean; reasons: string[] } {
    let valid = true;
    let reasons: string[] = [];

    if (options.bfi?.enabled && (!participant.bfiResults || !participant.bfiResults.success)) {
        valid = false;
        reasons.push(participant.bfiResults ? participant.bfiResults.message : "BFI results not found");
    }

    if (options.vark?.enabled && (!participant.varkResults || !participant.varkResults.success)) {
        valid = false;
        reasons.push(participant.varkResults ? participant.varkResults.message : "VARK results not found");
    }

    return { valid, reasons };
}