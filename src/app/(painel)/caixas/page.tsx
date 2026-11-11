import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { createStalwartClient } from "@/lib/stalwart/client";
import { PageHeader } from "@/components/page-header";
import { MailboxesPanel } from "@/components/mailboxes-panel";
import { env } from "@/lib/env";
import { listDomainAdmins, webmailAdminsEnabled } from "@/lib/webmail/admins";

export const metadata: Metadata = {
  title: "Caixas de entrada",
};

export default async function CaixasPage() {
  const { account } = await requireAccount();

  let mailboxes: Awaited<ReturnType<typeof listAccountMailboxes>> = [];
  let entitlement = null as Awaited<ReturnType<typeof getAccountEntitlement>>;
  let domains: string[] = [];

  if (account) {
    const admin = createAdminClient();
    entitlement = await getAccountEntitlement(account.id);
    mailboxes = await listAccountMailboxes(account.id);
    const { data: accountDomains } = await admin
      .from("domains")
      .select("name")
      .eq("account_id", account.id);
    try {
      const list = await createStalwartClient().listDomains();
      const stalwartNames = new Set(
        (list.data?.items ?? []).map((item) => item.name),
      );
      domains = (accountDomains ?? [])
        .map((item) => item.name)
        .filter((name) => stalwartNames.has(name));
      if (domains.length === 0) {
        domains = (accountDomains ?? []).map((item) => item.name);
      }
    } catch {
      domains = (accountDomains ?? []).map((item) => item.name);
    }
  }

  let admins: Record<string, string[]> = {};
  let adminsError: string | null = null;
  const adminsEnabled = webmailAdminsEnabled();
  if (adminsEnabled && mailboxes.length) {
    try {
      admins = await listDomainAdmins(mailboxes.map((mailbox) => mailbox.email.split("@")[1]));
    } catch (error) {
      adminsError = error instanceof Error ? error.message : "Falha ao ler admins do webmail";
    }
  }

  return (
    <div>
      <PageHeader
        title="Caixas de entrada"
        description="Assine caixas e crie e-mails na cota contratada. Domínios sem limite."
      />
      <MailboxesPanel
        mailboxes={mailboxes}
        entitlement={
          entitlement
            ? {
                entitled: true,
                planCode: entitlement.planCode,
                planMailboxes: entitlement.planMailboxes,
                extraMailboxes: entitlement.extraMailboxes,
                maxMailboxes: entitlement.maxMailboxes,
                usedMailboxes: entitlement.usedMailboxes,
                usedStorageMb: entitlement.usedStorageMb,
                maxStorageMb: entitlement.maxStorageMb,
                mailboxSlots: entitlement.mailboxSlots,
              }
            : null
        }
        domains={domains}
        webmailUrl={env.webmailUrl()}
        admins={admins}
        adminsEnabled={adminsEnabled}
        adminsError={adminsError}
      />
    </div>
  );
}
