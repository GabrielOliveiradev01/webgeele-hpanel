import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { listDomainAdmins, setDomainAdmins } from "@/lib/webmail/admins";

/** Marca ou desmarca uma caixa da conta como administradora da empresa no webmail. */
export async function PUT(request: Request) {
  const { account } = await requireAccount();
  if (!account) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { email?: string; admin?: boolean } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@") || typeof body?.admin !== "boolean") {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: mailbox } = await supabase
    .from("mailboxes")
    .select("id")
    .eq("account_id", account.id)
    .eq("email", email)
    .neq("status", "deleted")
    .maybeSingle();
  if (!mailbox) {
    return NextResponse.json({ error: "Esta caixa não pertence à sua conta." }, { status: 404 });
  }

  const domain = email.split("@")[1];
  try {
    const current = (await listDomainAdmins([domain]))[domain] ?? [];
    const next = body.admin ? [...current, email] : current.filter((item) => item !== email);
    const admins = await setDomainAdmins(domain, next);
    return NextResponse.json({ domain, admins });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar" },
      { status: 502 },
    );
  }
}
