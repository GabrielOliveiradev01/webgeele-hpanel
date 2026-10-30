import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error: qError } = await admin
    .from("support_tickets")
    .select("*")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 400 });
  }

  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.subject || !body.message) {
    return NextResponse.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("support_tickets")
    .insert({
      account_id: account.id,
      subject: body.subject,
      message: body.message,
      priority: body.priority || "normal",
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ticket: data });
}
