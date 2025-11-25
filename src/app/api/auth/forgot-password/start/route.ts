import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordStartSchema } from "@/lib/validations/auth";
import { connectToMongoDB } from "@/lib/db";
import { Account } from "@/models";
import { createHash, randomBytes, randomInt } from "crypto";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = forgotPasswordStartSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: parsed.error.format() },
				{ status: 400 }
			);
		}

		const { email } = parsed.data;
		await connectToMongoDB();
		const user = await Account.findOne({ email });

		if (!user || !user.securityQuestions || user.securityQuestions.length < 3) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.start",
				message: "User not found or missing security questions",
				email,
			});
			return NextResponse.json({ error: "User not found or not eligible for reset" }, { status: 404 });
		}

		if (user.disabled) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.start",
				message: "Account permanently disabled",
				userId: user._id.toString(),
				email,
			});
			return NextResponse.json({ error: "Permanently banned, please contact administrator for help" }, { status: 403 });
		}

		const questionsPool = [...user.securityQuestions];
		const selectedQuestions : any[] = [];
		while (selectedQuestions.length < 3 && questionsPool.length > 0) {
			const idx = randomInt(questionsPool.length);
			selectedQuestions.push(questionsPool[idx]);
			questionsPool.splice(idx, 1);
		}

		const token = randomBytes(32).toString("hex");
		const tokenHash = createHash("sha256").update(token).digest("hex");
		user.passwordReset = {
			tokenHash,
			expiresAt: new Date(Date.now() + RESET_TTL_MS),
			attempts: 0,
			verified: false,
		};
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "success",
			resource: "forgotPassword.start",
			message: "Issued security questions for reset",
			userId: user._id.toString(),
			email,
		});

		return NextResponse.json({
			success: true,
			token,
			questions: selectedQuestions.map((q) => ({
				questionId: q.questionId,
				prompt: q.question,
			})),
			expiresInMs: RESET_TTL_MS,
		});
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_READ,
			outcome: "failure",
			resource: "forgotPassword.start",
			message: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
