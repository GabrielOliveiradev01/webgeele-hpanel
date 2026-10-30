import type { Metadata } from "next";
import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { listDomains } from "@/lib/domains/service";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Meus serviços" };

export default async function ServicosPage() {
  const { account } = await requireAccount();
  const entitlement = account ? await getAccountEntitlement(account.id) : null;
  const mailboxes = account ? await listAccountMailboxes(account.id) : [];
  const domains = account ? await listDomains(account.id) : [];

  const services = [
    entitlement?.planName
      ? {
          name: "Plano WebGeele",
          detail: entitlement.planName,
          status: "Ativo",
          href: "/plano",
        }
      : null,
    mailboxes.length
      ? {
          name: "Caixas Stalwart",
          detail: `${mailboxes.length} / ${entitlement?.maxMailboxes ?? 0} caixas`,
          status: "Ativo",
          href: "/caixas",
        }
      : {
          name: "Caixas Stalwart",
          detail: "Nenhuma caixa criada",
          status: "—",
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
    {
      name: "DNS",
      detail: domains.length
        ? "Gerenciamento de registros"
        : "Adicione um domínio para configurar DNS",
      status: domains.length ? "Ativo" : "—",
      href: "/dns",
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
        description="Resumo dos serviços contratados e status operacional da conta."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Link
            key={service.name}
            href={service.href}
            className="rounded-2xl border border-wg-border bg-white p-5 transition hover:border-wg-purple/40"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-wg-graphite">
                {service.name}
              </h2>
              <span className="rounded-full bg-wg-surface px-2.5 py-1 text-xs font-medium text-wg-graphite">
                {service.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-wg-text-muted">{service.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
