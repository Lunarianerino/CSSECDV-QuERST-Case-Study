"use server";
import { connectToMongoDB } from "../db";
import { MatchStatus } from "@/models/match";
import { Match, ExamStatus, Exam, ExamAnswers } from "@/models";
import mongoose, { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { UserExamStatus } from "@/models/examStatus";

export interface StudentWithExams {
  matchId: string;
  studentId: string;
  name: string;
  email: string;
  pairingDate: string;
  exams: {
    id: string;
    examId: string;
    name: string;
    description: string;
    status: string;
    score?: number;
    maxScore?: number;
    correctAnswers?: number;
    incorrectAnswers?: number;
    skippedAnswers?: number;
    completedAt?: string;
    attemptNumber: number;
  }[];
}

/**
 * Get all students paired with the current tutor
 * TODO: Fix to use the new Programs feature to find pairings
 */
export async function getPairedStudentsAction(): Promise<StudentWithExams[]> {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Verify user is a tutor
    if (session.user.type !== AccountType.TUTOR) {
      throw new Error("Only tutors can access paired students");
    }

    // Find all active matches for this tutor
    const matches = await Match.find({
      tutorId: session.user.id,
      status: { $in: [MatchStatus.ACCEPTED, MatchStatus.ONGOING] }
    }).populate({
      path: "studentId",
      model: "Account",
      select: "name email"
    });

    // For each student, get their exam attempts
    const studentsWithExams = await Promise.all(matches.map(async (match) => {
      const matchId = match._id.toString();
      const student = match.studentId;
      
      // Find all exam attempts for this student that were assigned by this tutor
      const examAttempts = await ExamStatus.find({
        userId: student._id,
        assignedBy: session.user.id
      }).populate({
        path: "examId",
        model: "Exam"
      }).sort({ createdAt: -1 }); // Most recent first

      // Process each exam attempt to calculate performance metrics
      const exams = await Promise.all(examAttempts.map(async (attempt) => {
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let skippedAnswers = 0;

        // Only calculate detailed metrics for finished exams
        if (attempt.status === UserExamStatus.FINISHED) {
          // Get all answers for this attempt
          const answers = await ExamAnswers.find({
            _id: { $in: attempt.answers || [] }
          });

          // Get all questions for this exam
          const exam = await Exam.findById(attempt.examId._id).populate({
            path: "questions",
            populate: {
              path: "choices",
              model: "Choice"
            }
          });

          if (exam && exam.questions) {
            // For each question, check if it was answered correctly
            exam.questions.forEach(question => {
              const answer = answers.find(a => a.questionId.toString() === question._id.toString());
              
              if (!answer || (!answer.answers_choice?.length && !answer.answer_text)) {
                // Question was skipped
                skippedAnswers++;
              } else if (question.type === "choice") {
                // Single choice question
                const selectedId = answer.answers_choice[0];
                // console.log(`${question.choices}`)
                const selectedChoice = question.choices.find(c => c._id.toString() === selectedId);
                
                // console.log(`Selected ID: ${selectedId}`);
                // console.log(`Selected Choice: ${selectedChoice}`);
                if (selectedChoice?.isCorrect) {
                  correctAnswers++;
                } else {
                  incorrectAnswers++;
                }
              } else if (question.type === "multiple_choice") {
                // Multiple choice question - consider partially correct
                const choiceIds = answer.answers_choice;
                const correctChoices = question.choices.filter(c => c.isCorrect).map(c => c._id.toString());
                const selectedCorrect = choiceIds.filter(id => correctChoices.includes(id));
                
                if (selectedCorrect.length === correctChoices.length && selectedCorrect.length === choiceIds.length) {
                  // All correct choices selected and no incorrect ones
                  correctAnswers++;
                } else if (selectedCorrect.length > 0) {
                  // Partially correct
                  correctAnswers += 0.5;
                  incorrectAnswers += 0.5;
                } else {
                  // All wrong
                  incorrectAnswers++;
                }
              } else {
                // Text answer - use the score if available
                if (answer.score) {
                  if (answer.score > 0) {
                    correctAnswers++;
                  } else {
                    incorrectAnswers++;
                  }
                } else {
                  // Not graded yet
                  skippedAnswers++;
                }
              }
            });
          }
        }

        return {
          id: attempt._id.toString(),
          examId: attempt.examId._id.toString(),
          name: attempt.examId.name,
          description: attempt.examId.description,
          status: attempt.status,
          score: attempt.score,
          maxScore: attempt.examId.questions?.length || 0,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          skippedAnswers: skippedAnswers,
          completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : undefined,
          attemptNumber: attempt.attemptNumber || 1
        };
      }));

      // console.log(exams);
      return {
        matchId: matchId,
        studentId: student._id.toString(),
        name: student.name,
        email: student.email,
        pairingDate: match.createdAt ? new Date(match.createdAt).toISOString() : new Date().toISOString(),
        exams: exams
      };
    }));

    return studentsWithExams;
  } catch (error) {
    console.error("Error fetching paired students:", error);
    throw new Error("Failed to fetch paired students");
  }
}

// Type definitions for our return values
export type PairingBasic = {
  id: string;
  studentId: string;
  tutorId: string;
  status: string;
  reason?: string;
  subject: string;
};

export type PairingDetailed = {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  tutor: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  reason?: string;
  subject: string;
};

/**
 * Create a new pairing between a student and a tutor
 */
export async function createPairing({
  studentId,
  tutorId,
  subject,
  status = MatchStatus.PENDING,
}: {
  studentId: string;
  tutorId: string;
  subject: string;
  status?: string;
}): Promise<PairingBasic | null> {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to create pairings");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Validate subject against enum

    // Validate status against enum
    if (!Object.values(MatchStatus).includes(status as MatchStatus)) {
      throw new Error("Invalid status");
    }

    // Create new pairing
    const newPairing = await Match.create({
      studentId: new Types.ObjectId(studentId),
      tutorId: new Types.ObjectId(tutorId),
      subject,
      status,
    });

    return {
      id: newPairing._id.toString(),
      studentId: newPairing.studentId.toString(),
      tutorId: newPairing.tutorId.toString(),
      status: newPairing.status,
      reason: newPairing.reason,
      subject: newPairing.subject,
    };
  } catch (error) {
    console.error("Error creating pairing:", error);
    throw new Error("Failed to create pairing");
  }
}

/**
 * Get all pairings with populated student and tutor information
 */
export async function getAllPairings(): Promise<PairingDetailed[]> {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to view pairings");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Get all pairings with populated student and tutor information
    const pairings = await Match.find({})
      .populate("studentId", "_id name email")
      .populate("tutorId", "_id name email");

    // Transform the data to a client-friendly format
    return pairings.map((pairing: any) => ({
      id: pairing._id.toString(),
      student: {
        id: pairing.studentId._id.toString(),
        name: pairing.studentId.name,
        email: pairing.studentId.email,
      },
      tutor: {
        id: pairing.tutorId._id.toString(),
        name: pairing.tutorId.name,
        email: pairing.tutorId.email,
      },
      status: pairing.status,
      reason: pairing.reason,
      subject: pairing.subject,
    }));
  } catch (error) {
    console.error("Error fetching pairings:", error);
    throw new Error("Failed to fetch pairings");
  }
}

/**
 * Get a specific pairing by ID with populated student and tutor information
 */
export async function getPairingById(pairingId: string): Promise<PairingDetailed | null> {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to view this pairing");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Get the pairing with populated student and tutor information
    const pairing = await Match.findById(pairingId)
      .populate("studentId", "_id name email")
      .populate("tutorId", "_id name email");

    if (!pairing) {
      return null;
    }

    // Transform the data to a client-friendly format
    return {
      id: pairing._id.toString(),
      student: {
        id: pairing.studentId._id.toString(),
        name: pairing.studentId.name,
        email: pairing.studentId.email,
      },
      tutor: {
        id: pairing.tutorId._id.toString(),
        name: pairing.tutorId.name,
        email: pairing.tutorId.email,
      },
      status: pairing.status,
      reason: pairing.reason,
      subject: pairing.subject,
    };
  } catch (error) {
    console.error("Error fetching pairing:", error);
    throw new Error("Failed to fetch pairing");
  }
}

/**
 * Update a pairing's status and optionally add a reason
 */
export async function updatePairingStatus({
  pairingId,
  status,
  reason,
}: {
  pairingId: string;
  status: string;
  reason?: string;
}): Promise<PairingBasic | null> {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to update pairings");
    }

    // Validate status against enum
    if (!Object.values(MatchStatus).includes(status as MatchStatus)) {
      throw new Error("Invalid status");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Update the pairing
    const updateData: { status: string; reason?: string } = { status };
    if (reason) {
      updateData.reason = reason;
    }

    const updatedPairing = await Match.findByIdAndUpdate(
      pairingId,
      updateData,
      { new: true }
    );

    if (!updatedPairing) {
      return null;
    }

    return {
      id: updatedPairing._id.toString(),
      studentId: updatedPairing.studentId.toString(),
      tutorId: updatedPairing.tutorId.toString(),
      status: updatedPairing.status,
      reason: updatedPairing.reason,
      subject: updatedPairing.subject,
    };
  } catch (error) {
    console.error("Error updating pairing:", error);
    throw new Error("Failed to update pairing");
  }
}

/**
 * Delete a pairing
 */
export async function deletePairing(pairingId: string): Promise<boolean> {
  try {
    // Check if user is authorized (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to delete pairings");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Delete the pairing
    const result = await Match.findByIdAndDelete(pairingId);

    return !!result; // Return true if deletion was successful
  } catch (error) {
    console.error("Error deleting pairing:", error);
    throw new Error("Failed to delete pairing");
  }
}

/**
 * Get pairings for a specific student or tutor
 */
export async function getPairingsByUser({
  userId,
  userType,
}: {
  userId: string;
  userType: "student" | "tutor";
}): Promise<PairingDetailed[]> {
  try {
    // Check if user is authorized (admin or the user themselves)
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.id !== userId && session.user?.type !== AccountType.ADMIN)) {
      throw new Error("Not authorized to view these pairings");
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Set up the query based on user type
    const query = userType === "student" 
      ? { studentId: new Types.ObjectId(userId) }
      : { tutorId: new Types.ObjectId(userId) };

    // Get the pairings with populated student and tutor information
    const pairings = await Match.find(query)
      .populate("studentId", "_id name email")
      .populate("tutorId", "_id name email");

    // Transform the data to a client-friendly format
    return pairings.map((pairing: any) => ({
      id: pairing._id.toString(),
      student: {
        id: pairing.studentId._id.toString(),
        name: pairing.studentId.name,
        email: pairing.studentId.email,
      },
      tutor: {
        id: pairing.tutorId._id.toString(),
        name: pairing.tutorId.name,
        email: pairing.tutorId.email,
      },
      status: pairing.status,
      reason: pairing.reason,
      subject: pairing.subject,
    }));
  } catch (error) {
    console.error("Error fetching pairings by user:", error);
    throw new Error("Failed to fetch pairings");
  }
}

/*
 Get all pairings for the user.
*/
export async function getUserPairings(): Promise<PairingDetailed[]> {
 try {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Not authorized to view pairings");
  }
  await connectToMongoDB();

  const pairings = await Match.find({
    $or: [
     { studentId: new Types.ObjectId(session.user.id) },
     { tutorId: new Types.ObjectId(session.user.id) },
    ],
  }).populate("studentId", "_id name email").populate("tutorId", "_id name email");

  return pairings.map((pairing: any) => ({
    id: pairing._id.toString(),
    student: {
     id: pairing.studentId._id.toString(),
     name: pairing.studentId.name,
     email: pairing.studentId.email,
    }, 
    tutor: {
     id: pairing.tutorId._id.toString(),
     name: pairing.tutorId.name, 
     email: pairing.tutorId.email,
    },
    status: pairing.status,
    reason: pairing.reason,
    subject: pairing.subject,
  }))
 } catch (error) {
  console.error("Error fetching pairings:", error);
  throw new Error("Failed to fetch pairings");
 }
}