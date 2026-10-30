import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createMailboxForAccount,
  listAccountMailboxes,
} from "@/lib/mailboxes/service";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { createStalwartClient } from "@/lib/stalwart/client";

async function getOwnedAccountId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!account) {
    return { error: NextResponse.json({ error: "Conta não encontrada" }, { status: 404 }) };
  }

  return { accountId: account.id as string };
}

export async function GET() {
  const owned = await getOwnedAccountId();
  if ("error" in owned && owned.error) return owned.error;

  const accountId = owned.accountId!;
  const admin = createAdminClient();
  const [mailboxes, entitlement, accountDomains, stalwartDomains] =
    await Promise.all([
      listAccountMailboxes(accountId),
      getAccountEntitlement(accountId),
      admin.from("domains").select("name").eq("account_id", accountId),
      createStalwartClient().listDomains(),
    ]);

  const stalwartNames = new Set(
    (stalwartDomains.data?.items ?? []).map((item) => item.name),
  );
  const domains = (accountDomains.data ?? [])
    .map((item) => item.name)
    .filter((name) => stalwartNames.has(name));

  return NextResponse.json({
    mailboxes,
    entitlement,
    domains,
  });
}

export async function POST(request: Request) {
  const owned = await getOwnedAccountId();
  if ("error" in owned && owned.error) return owned.error;

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      description?: string;
    };

    if (!body.email) {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    const result = await createMailboxForAccount({
      accountId: owned.accountId!,
      email: body.email,
      password: body.password,
      description: body.description,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao criar caixa" },
      { status: 400 },
    );
  }
}
