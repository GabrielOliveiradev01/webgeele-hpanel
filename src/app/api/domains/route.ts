import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { requireAccount } from "@/lib/auth/account";
import { addExternalDomain, listDomains } from "@/lib/domains/service";

export async function GET() {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated") {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!account) return NextResponse.json({ domains: [] });

  const domains = await listDomains(account.id);
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "add_external") {
      const result = await addExternalDomain(account.id, body.name);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: publicErrorMessage(err, "Falha") },
      { status: 400 },
    );
  }
}
