import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listDomains } from "@/lib/domains/service";
import { PageHeader } from "@/components/page-header";
import { DomainsPanel } from "@/components/domains-panel";

export const metadata: Metadata = { title: "Domínios" };

export default async function DominiosPage() {
  const { account } = await requireAccount();
  const domains = account ? await listDomains(account.id) : [];
  const entitlement = account ? await getAccountEntitlement(account.id) : null;

  return (
    <div>
      <PageHeader
        title="Domínios"
        description="Cadastre e gerencie domínios sem limite de quantidade. Geramos os DNS do correio."
      />
      <DomainsPanel
        domains={domains}
        maxDomains={entitlement?.maxDomains ?? null}
      />
    </div>
  );
}
