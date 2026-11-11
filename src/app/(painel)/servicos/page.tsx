import type { Metadata } from "next";
import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { listDomains } from "@/lib/domains/service";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Meus serviços" };

export default async function ServicosPage() {
  const { account } = await requireAccount();
  const entitlement = account ? await getAccountEntitlement(account.id) : null;
  const mailboxes = account ? await listAccountMailboxes(account.id) : [];
  const domains = account ? await listDomains(account.id) : [];

  const bought = entitlement?.maxMailboxes ?? 0;
  const services = [
    {
      name: "Caixas de e-mail",
      detail:
        bought > 0
          ? `${mailboxes.length} ${mailboxes.length === 1 ? "criada" : "criadas"} · ${bought} ${bought === 1 ? "contratada" : "contratadas"}`
          : "Nenhuma caixa contratada",
      status: bought > 0 ? "Ativo" : "—",
      href: "/caixas",
    },
    domains.length
      ? {
          name: "Domínios",
          detail: `${domains.length} domínio(s) · sem limite`,
          status: "Ativo",
          href: "/dominios",
        }
      : {
          name: "Domínios",
          detail: "Nenhum domínio na conta",
          status: "—",
          href: "/dominios",
        },
  ].filter(Boolean) as Array<{
    name: string;
    detail: string;
    status: string;
    href: string;
  }>;

  return (
    <div>
      <PageHeader
        title="Meus serviços"
        description="Caixas de e-mail compradas e domínios da conta."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Link
            key={service.name}
            href={service.href}
            className="wg-card p-5 transition hover:border-wg-brand/40"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-wg-graphite">
                {service.name}
              </h2>
              <StatusBadge status={service.status} />
            </div>
            <p className="mt-2 text-sm text-wg-text-muted">{service.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
