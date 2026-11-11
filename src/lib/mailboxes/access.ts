import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStalwartClient,
  disabledPermissionsFor,
} from "@/lib/stalwart/client";

export type MailboxControl =
  | "block-mail"
  | "unblock-mail"
  | "block-access"
  | "unblock-access"
  | "pause-access"
  | "resume-access"
  | "reset-password"
  | "make-admin";

type MailboxRow = {
  id: string;
  account_id: string;
  domain_id: string | null;
  email: string;
  stalwart_account_id: string | null;
  status: string;
  mail_blocked: boolean;
  access_blocked: boolean;
  access_paused: boolean;
  is_domain_admin: boolean;
};

async function syncStalwart(mailbox: MailboxRow) {
  const client = createStalwartClient();
  if (!client.configured()) return;
  const name = mailbox.stalwart_account_id || mailbox.email;
  await client.setDisabledPermissions(name, disabledPermissionsFor(mailbox));
}

export async function updateMailboxControl(input: {
  accountId: string;
  mailboxId: string;
  action: MailboxControl;
  password?: string;
}) {
  const admin = createAdminClient();
  const { data: mailbox, error } = await admin
    .from("mailboxes")
    .select(
      "id, account_id, domain_id, email, stalwart_account_id, status, mail_blocked, access_blocked, access_paused, is_domain_admin",
    )
    .eq("id", input.mailboxId)
    .eq("account_id", input.accountId)
    .neq("status", "deleted")
    .maybeSingle();

  if (error) throw error;
  if (!mailbox) throw new Error("Caixa não encontrada.");

  const row = mailbox as MailboxRow;

  if (input.action === "make-admin") {
    if (!row.domain_id) throw new Error("Esta caixa não está ligada a um domínio.");
    const { error: clearError } = await admin
      .from("mailboxes")
      .update({ is_domain_admin: false })
      .eq("account_id", input.accountId)
      .eq("domain_id", row.domain_id);
    if (clearError) throw clearError;
    const { error: setError } = await admin
      .from("mailboxes")
      .update({ is_domain_admin: true })
      .eq("id", row.id);
    if (setError) throw setError;
    return { email: row.email, password: null as string | null };
  }

  if (input.action === "reset-password") {
    const password = input.password?.trim() ?? "";
    if (password.length < 8) {
      throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
    }
    const client = createStalwartClient();
    if (!client.configured()) throw new Error("Servidor de e-mail não configurado.");
    await client.setMailboxPassword(row.stalwart_account_id || row.email, password);
    return { email: row.email, password };
  }

  const patch: Partial<MailboxRow> = {};
  if (input.action === "block-mail") patch.mail_blocked = true;
  if (input.action === "unblock-mail") patch.mail_blocked = false;
  if (input.action === "block-access") {
    patch.access_blocked = true;
    patch.access_paused = false;
  }
  if (input.action === "unblock-access") patch.access_blocked = false;
  if (input.action === "pause-access") {
    patch.access_paused = true;
    patch.access_blocked = false;
  }
  if (input.action === "resume-access") patch.access_paused = false;

  const next = { ...row, ...patch };
  const { error: updateError } = await admin.from("mailboxes").update(patch).eq("id", row.id);
  if (updateError) throw updateError;
  await syncStalwart(next);

  return { email: row.email, password: null as string | null };
}
