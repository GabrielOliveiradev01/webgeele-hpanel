import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { listMigrations, type MigrationView } from "@/lib/transfer/service";
import { MIGRATION_PROVIDERS } from "@/lib/transfer/providers";
import { PageHeader } from "@/components/page-header";
import { MigrationPanel } from "@/components/migration-panel";

export const metadata: Metadata = {
  title: "Migração de e-mails",
};

export default async function MigracaoPage() {
  const { account } = await requireAccount();

  let mailboxes: Array<{ id: string; email: string }> = [];
  let migrations: MigrationView[] = [];
  let loadError: string | null = null;

  if (account) {
    const all = await listAccountMailboxes(account.id);
    mailboxes = all
      .filter((mailbox) => mailbox.status === "active")
      .map((mailbox) => ({ id: mailbox.id, email: mailbox.email }));
    try {
      migrations = await listMigrations(account.id);
    } catch {
      loadError = "Não foi possível carregar o histórico de migrações.";
    }
  }

  return (
    <div>
      <PageHeader
        title="Migração de e-mails"
        description="Copie as mensagens e pastas da sua conta antiga para uma caixa WebGeele. A conta de origem não é alterada: nada é apagado ou movido."
      />
      <MigrationPanel
        providers={MIGRATION_PROVIDERS.map(({ id, label, hint }) => ({ id, label, hint }))}
        mailboxes={mailboxes}
        initialMigrations={migrations}
        loadError={loadError}
      />
    </div>
  );
}
