import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountEntitlement } from "@/lib/billing/entitlements";

export async function GET() {
  const { user, account, error } = await requireAccount();
  if (error === "unauthenticated") {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const entitlement = account
    ? await getAccountEntitlement(account.id)
    : null;

  return NextResponse.json({ user, account, entitlement });
}

export async function PATCH(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("accounts")
    .update({
      legal_name: body.legal_name ?? account.legal_name,
      trade_name: body.trade_name ?? account.trade_name,
      document: body.document ?? account.document,
      phone: body.phone ?? account.phone,
      email: body.email ?? account.email,
    })
    .eq("id", account.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ account: data });
}
