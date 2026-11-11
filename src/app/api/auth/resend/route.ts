import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { resendConfirmation } from "@/lib/auth/signup-email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const result = await resendConfirmation({ request, email });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[resend]", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Não foi possível reenviar o e-mail.") },
      { status: 400 },
    );
  }
}
