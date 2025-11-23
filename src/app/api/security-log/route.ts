import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

export const runtime = "nodejs";

const allowedEvents = new Set(Object.values(SecurityEvent));
const LOG_TOKEN = process.env.SECURITY_LOG_TOKEN;

export async function POST(req: NextRequest) {
  try {
    if (LOG_TOKEN) {
      const token = req.headers.get("x-log-token");
      if (token !== LOG_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { event, outcome, userId, email, resource, message, metadata } = body || {};

    if (!allowedEvents.has(event) || (outcome !== "success" && outcome !== "failure")) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await logSecurityEvent({
      event,
      outcome,
      userId,
      email,
      resource,
      message,
      metadata,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("security-log route error", err);
    return NextResponse.json({ error: "Log failed" }, { status: 500 });
  }
}
