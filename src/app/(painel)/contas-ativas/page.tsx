import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { PageHeader } from "@/components/page-header";
import { ActiveAccountsPanel, type ActiveMailbox } from "@/components/active-accounts-panel";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contas ativas",
};

function domainName(mailbox: {
  email: string;
  domain?: { name: string } | { name: string }[] | null;
}) {
  const domain = mailbox.domain;
  if (Array.isArray(domain)) return domain[0]?.name || mailbox.email.split("@")[1] || "";
  return domain?.name || mailbox.email.split("@")[1] || "";
}

export default async function ContasAtivasPage() {
  const { account } = await requireAccount();
  const rows = account ? await listAccountMailboxes(account.id) : [];
  const mailboxes: ActiveMailbox[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    quota_mb: row.quota_mb,
    domainName: domainName(row),
    mail_blocked: Boolean(row.mail_blocked),
    access_blocked: Boolean(row.access_blocked),
    access_paused: Boolean(row.access_paused),
    is_domain_admin: Boolean(row.is_domain_admin),
  }));

  return (
    <div>
      <PageHeader
        title="Contas ativas"
        description="Escolha uma caixa para bloquear, pausar o acesso, redefinir a senha ou definir o administrador do domínio."
      />
      <ActiveAccountsPanel mailboxes={mailboxes} webmailUrl={env.webmailUrl()} />
    </div>
  );
}
