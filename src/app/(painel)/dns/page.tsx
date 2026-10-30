import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { listDomains } from "@/lib/domains/service";
import { listDnsRecords } from "@/lib/dns/service";
import { PageHeader } from "@/components/page-header";
import { DnsPanel } from "@/components/dns-panel";

export const metadata: Metadata = { title: "DNS" };

export default async function DnsPage() {
  const { account } = await requireAccount();
  const domains = account ? await listDomains(account.id) : [];
  const records = account ? await listDnsRecords(account.id) : [];

  return (
    <div>
      <PageHeader
        title="DNS"
        description="Gerencie registros A, AAAA, CNAME, MX, TXT e outros por domínio."
      />
      <DnsPanel domains={domains} records={records as never} />
    </div>
  );
}
