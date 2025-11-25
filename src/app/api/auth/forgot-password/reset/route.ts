import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithSecurityToken } from "@/lib/actions/userActions";
import { resetPasswordWithTokenSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = resetPasswordWithTokenSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: parsed.error.format() },
				{ status: 400 }
			);
		}

		const result = await resetPasswordWithSecurityToken(parsed.data);
		return NextResponse.json(result, { status: result.status });
	} catch (error) {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
