import { connectToMongoDB } from "@/lib/db";
import { SecurityLog } from "@/models";
import { SecurityEvent, SecurityOutcome } from "@/models/securityLogs";
import type { NextRequest } from "next/server";

type LogInput = {
  event: SecurityEvent;
  outcome: SecurityOutcome;
  userId?: string;
  email?: string;
  resource?: string;
  message?: string;
  metadata?: Record<string, any>;
  req?: NextRequest | { headers?: { get(name: string): string | null } };
};

export async function logSecurityEvent(input: LogInput) {
  try {
    await connectToMongoDB();
    const ip =
      input.req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      input.req?.headers?.get("x-real-ip") ||
      undefined;
    console.log('here');
    await SecurityLog.create({
      event: input.event,
      outcome: input.outcome,
      userId: input.userId,
      actorEmail: input.email,
      resource: input.resource,
      message: input.message,
      ip,
      metadata: input.metadata,
    });
  } catch (err) {
    console.error("Security log failure", err);
  }
}

export function validateWithLogging<T extends { safeParse(data: unknown): any }>(
  schema: T,
  data: unknown,
  context: { userId?: string; resource: string }
) {
  const result = (schema as any).safeParse(data);
  if (!result.success) {
    logSecurityEvent({
      event: SecurityEvent.VALIDATION,
      outcome: "failure",
      userId: context.userId,
      resource: context.resource,
      metadata: { issues: result.error.issues },
      message: String(result.error.issues)
    });
    throw result.error;
  }
  logSecurityEvent({
    event: SecurityEvent.VALIDATION,
    outcome: "success",
    userId: context.userId,
    resource: context.resource,
    metadata: { result: result.data },
  });
  return result.data as typeof result.data;
}
