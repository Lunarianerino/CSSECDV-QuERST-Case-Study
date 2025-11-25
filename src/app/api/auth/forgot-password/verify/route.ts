import { NextRequest, NextResponse } from "next/server";
import { verifySecurityQuestionsSchema } from "@/lib/validations/auth";
import { connectToMongoDB } from "@/lib/db";
import { Account } from "@/models";
import { createHash } from "crypto";
import { compareSync } from "bcrypt-ts";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = verifySecurityQuestionsSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: parsed.error.format() },
				{ status: 400 }
			);
		}

		const { email, token, answers } = parsed.data;
		await connectToMongoDB();
		const user = await Account.findOne({ email });

		if (!user || !user.passwordReset || !user.passwordReset.tokenHash) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Reset token missing",
				email,
			});
			return NextResponse.json({ error: "Invalid or expired reset request" }, { status: 400 });
		}

		if (user.disabled) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Account permanently disabled",
				userId: user._id.toString(),
				email,
			});
			return NextResponse.json({ error: "Permanently banned, please contact administrator for help" }, { status: 403 });
		}

		if (!user.passwordReset.expiresAt || user.passwordReset.expiresAt.getTime() < Date.now()) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Reset token expired",
				email,
			});
			user.passwordReset = undefined;
			await user.save();
			return NextResponse.json({ error: "Reset token expired" }, { status: 400 });
		}

		if (user.passwordReset.attempts >= MAX_ATTEMPTS) {
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Too many attempts",
				userId: user._id.toString(),
				email,
			});
			user.passwordReset = undefined;
			user.disabled = true;
			await user.save();
			return NextResponse.json({ error: "Permanently banned, please contact administrator for help" }, { status: 403 });
		}

		const providedHash = createHash("sha256").update(token).digest("hex");
		if (providedHash !== user.passwordReset.tokenHash) {
			user.passwordReset.attempts += 1;
			await user.save();
			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Token hash mismatch",
				userId: user._id.toString(),
				email,
			});
			return NextResponse.json({ error: "Invalid or expired reset request" }, { status: 400 });
		}

		let allValid = true;
		for (const answer of answers) {
			const stored = user.securityQuestions?.find(
				(q) => q.questionId === answer.questionId
			);
			if (!stored || !compareSync(answer.answer, stored.answerHash)) {
				allValid = false;
				break;
			}
		}

		if (!allValid) {
			user.passwordReset.attempts += 1;
			const banned = user.passwordReset.attempts >= MAX_ATTEMPTS;
			await user.save();

			await logSecurityEvent({
				event: SecurityEvent.ACCESS_DENIED,
				outcome: "failure",
				resource: "forgotPassword.verify",
				message: "Security answers mismatch",
				userId: user._id.toString(),
				email,
			});

			const status = banned ? 403 : 400;
			if (banned) {
				user.passwordReset = undefined;
				user.disabled = true;
				await user.save();
			}
			return NextResponse.json(
				{ error: banned ? "Permanently banned, please contact administrator for help" : "Incorrect security answers" },
				{ status }
			);
		}

		user.passwordReset.verified = true;
		user.passwordReset.attempts = 0;
		await user.save();

		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "success",
			resource: "forgotPassword.verify",
			message: "Security questions answered",
			userId: user._id.toString(),
			email,
		});

		return NextResponse.json({ success: true, token, email });
	} catch (error) {
		await logSecurityEvent({
			event: SecurityEvent.OPERATION_UPDATE,
			outcome: "failure",
			resource: "forgotPassword.verify",
			message: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
