import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateMailboxControl, type MailboxControl } from "@/lib/mailboxes/access";

const ACTIONS: MailboxControl[] = [
  "block-mail",
  "unblock-mail",
  "block-access",
  "unblock-access",
  "pause-access",
  "resume-access",
  "reset-password",
  "make-admin",
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  try {
    const body = (await request.json()) as {
      mailboxId?: string;
      action?: MailboxControl;
      password?: string;
    };
    if (!body.mailboxId || !body.action || !ACTIONS.includes(body.action)) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const result = await updateMailboxControl({
      accountId: account.id,
      mailboxId: body.mailboxId,
      action: body.action,
      password: body.password,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: publicErrorMessage(error, "Não foi possível atualizar a caixa.") },
      { status: 400 },
    );
  }
}
