"use server";

import { connectToMongoDB } from "../db";
import { Account, ExamStatus, Match, Schedule } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountType } from "@/models/account";
import { UserExamStatus } from "@/models/examStatus";
import { MatchStatus } from "@/models/match";
import { WeeklySchedule } from "@/types/schedule";
import { SpecialExam } from "@/models";
import { ExamTags } from "@/models/specialExam";
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  type: string;
  onboarded: boolean;
  schedule: any; // Weekly schedule from schedule action
  bfi_status: string;
  vark_status: string;
  exams: {
    id: string;
    examId: string;
    name: string;
    description: string;
    status: string;
    score?: number;
    maxScore?: number;
    completedAt?: string;
    results?: string;
    attemptNumber?: number;
    type: string;
  }[];
  pairings: {
    id: string;
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    status: string;
    subject: string;
    createdAt: string;
  }[];
}

export async function getUserProfileAction(userId: string): Promise<UserProfile | null> {
  try {
    await connectToMongoDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Only admins can view other users' profiles
    if (session.user.id !== userId && session.user.type !== AccountType.ADMIN) {
      throw new Error("Not authorized to view this profile");
    }

    // Get user details
    const user = await Account.findById(userId);
    if (!user) {
      return null;
    }

    const specialExams = await SpecialExam.find({});
    let VARKStatus = "No VARK Questionnaire set";
    let BFIStatus = "No BFI Questionnaire set";
    if (specialExams) {
      const VARKExam = specialExams.find((exam) => exam.tag.includes(ExamTags.VARK));
      const BFIExam = specialExams.find((exam) => exam.tag.includes(ExamTags.BFI));
      if (VARKExam) {
        const VarkExamAttempt = await ExamStatus.find({ userId: userId, examId: VARKExam?.examId.toString() });
        if (VarkExamAttempt.length > 0) {
          VARKStatus = VarkExamAttempt[VarkExamAttempt.length - 1].status;
        } else {
          VARKStatus = "No attempt assigned";
        }
      }

      if (BFIExam) {
        const BFIExamAttempt = await ExamStatus.find({ userId: userId, examId: BFIExam?.examId.toString() });      

        if (BFIExamAttempt.length > 0) {
          BFIStatus = BFIExamAttempt[BFIExamAttempt.length - 1].status;
        } else {
          BFIStatus = "No attempt assigned";
        }
      }

    }
    // Get user schedule directly from database
    let schedule = null;
    try {
      // Find the schedule for the user and populate assignment references
      const userSchedule = await Schedule.findOne({ userId })
        .populate({
          path: 'schedule.monday.intervals.assignment schedule.tuesday.intervals.assignment schedule.wednesday.intervals.assignment schedule.thursday.intervals.assignment schedule.friday.intervals.assignment schedule.saturday.intervals.assignment schedule.sunday.intervals.assignment',
          model: 'Account',
          select: 'name email type' // Only select necessary fields
        })
        .lean() as {
          schedule: WeeklySchedule;
        } | null;

      if (userSchedule) {
        // Convert to plain JavaScript object to remove any circular references
        schedule = JSON.parse(JSON.stringify(userSchedule.schedule));
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      // Continue with null schedule
    }

    // Get user exams
    const examStatuses = await ExamStatus.find({ userId }).populate({
      path: "examId",
      model: "Exam",
    });

    const exams = examStatuses.map((examStatus: any) => {
      let results = "Not Graded";
      if (examStatus.status === UserExamStatus.FINISHED && examStatus.score !== undefined) {
        results = "Graded";
      }
      // console.log(examStatus.score);
      return {
        id: examStatus._id.toString(),
        examId: examStatus.examId._id.toString(),
        name: examStatus.examId.name,
        description: examStatus.examId.description,
        status: examStatus.status,
        score: examStatus.score,
        maxScore: examStatus.examId.maxScore,
        completedAt: examStatus.completedAt ? examStatus.completedAt : undefined,
        results,
        attemptNumber: examStatus.attemptNumber || 1,
        type: examStatus.examId.type,
      };
    });

    // Get user pairings
    let pairings : any[] = [];
    if (user.type === AccountType.STUDENT) {
      // For students, find matches where they are the student
      const matches = await Match.find({ 
        studentId: userId,
      }).populate('tutorId', 'name email');

      pairings = matches.map((match: any) => ({
        id: match._id.toString(),
        partnerId: match.tutorId._id.toString(),
        partnerName: match.tutorId.name,
        partnerEmail: match.tutorId.email,
        status: match.status,
        subject: match.subject,
        createdAt: new Date(match.createdAt).toLocaleDateString(),
      }));
      // console.log(pairings); // Add this line to check the match data

    } else if (user.type === AccountType.TUTOR) {
      // For tutors, find matches where they are the tutor
      const matches = await Match.find({ 
        tutorId: userId,
      }).populate('studentId', 'name email');

      pairings = matches.map((match: any) => ({
        id: match._id.toString(),
        partnerId: match.studentId._id.toString(),
        partnerName: match.studentId.name,
        partnerEmail: match.studentId.email,
        status: match.status,
        subject: match.subject,
        createdAt: new Date(match.createdAt).toLocaleDateString(),
      }));
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      onboarded: user.onboarded,
      bfi_status: BFIStatus,
      vark_status: VARKStatus,
      schedule,
      exams,
      pairings,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
}