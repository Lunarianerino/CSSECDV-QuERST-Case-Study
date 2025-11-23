"use server";

import { connectToMongoDB } from "../db";
import { SecurityLog } from "@/models";
import { SecurityEvent } from "@/models/securityLogs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { AccountType } from "@/models/account";
import { logSecurityEvent } from "../securityLogger";

export type SecurityLogEntry = {
  id: string;
  event: SecurityEvent;
  outcome: "success" | "failure";
  userId?: string;
  actorEmail?: string;
  resource?: string;
  message?: string;
  ip?: string;
  createdAt: string;
};

export async function getSecurityLogsAction(limit = 200): Promise<{
  success: boolean;
  status: number;
  data?: SecurityLogEntry[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.type !== AccountType.ADMIN) {
      await logSecurityEvent({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: session?.user?.id,
        resource: "getSecurityLogsAction",
        message: "Unauthorized",
      });
      return { success: false, status: 401, error: "Unauthorized" };
    }

    await connectToMongoDB();
    const logs = await SecurityLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    const data: SecurityLogEntry[] = logs.map((log: any) => ({
      id: log._id.toString(),
      event: log.event,
      outcome: log.outcome,
      userId: log.userId,
      actorEmail: log.actorEmail,
      resource: log.resource,
      message: log.message,
      ip: log.ip,
      createdAt: log.createdAt?.toISOString() ?? "",
    }));

    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "success",
      userId: session.user?.id,
      resource: "getSecurityLogsAction",
      message: `Fetched ${data.length} security log(s)`,
    });

    return { success: true, status: 200, data };
  } catch (error) {
    console.error("Error fetching security logs:", error);
    await logSecurityEvent({
      event: SecurityEvent.OPERATION_READ,
      outcome: "failure",
      resource: "getSecurityLogsAction",
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
    };
  }
}
