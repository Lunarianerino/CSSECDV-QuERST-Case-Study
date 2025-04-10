"use server";
import { connectToMongoDB } from "../db";
import { MatchStatus } from "@/models/match";
import { Match } from "@/models";
import mongoose, { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";

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