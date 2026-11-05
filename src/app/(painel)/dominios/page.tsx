import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { listDomains } from "@/lib/domains/service";
import { listDnsRecords } from "@/lib/dns/service";
import { PageHeader } from "@/components/page-header";
import { DomainsPanel } from "@/components/domains-panel";

export const metadata: Metadata = { title: "Domínios" };

export default async function DominiosPage() {
  const { account } = await requireAccount();
  const domains = account ? await listDomains(account.id) : [];
  const dnsRecords = account ? await listDnsRecords(account.id) : [];

  return (
    <div>
      <PageHeader
        title="Domínios"
        description="Adicione os domínios que você já tem. Geramos os registros de DNS do e-mail para você cadastrar."
      />
      <DomainsPanel domains={domains} dnsRecords={dnsRecords as never} />
    </div>
  );
}
