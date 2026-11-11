import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { registerAccount } from "@/lib/auth/signup-email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 8 caracteres." },
        { status: 400 },
      );
    }

    const result = await registerAccount({ request, name, email, password });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[signup]", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Não foi possível criar a conta.") },
      { status: 400 },
    );
  }
}
