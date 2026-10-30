import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { listDomains } from "@/lib/domains/service";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
  const { account, user } = await requireAccount();
  const entitlement = account ? await getAccountEntitlement(account.id) : null;
  const mailboxes = account ? await listAccountMailboxes(account.id) : [];
  const domains = account ? await listDomains(account.id) : [];

  let openTickets = 0;
  if (account) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("account_id", account.id)
      .eq("status", "open");
    openTickets = count ?? 0;
  }

  const name =
    account?.legal_name ||
    account?.trade_name ||
    user?.email?.split("@")[0] ||
    "cliente";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-wg-text-muted">Olá, {name}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-wg-graphite sm:text-[2.15rem]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-wg-text-muted">
            Caixas por assinatura Assas, domínios ilimitados e DNS do correio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3.5 py-2 text-sm text-wg-graphite">
            <span className="h-2 w-2 rounded-full bg-wg-success" />
            Conta ativa
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-wg-graphite px-3.5 py-2 text-sm font-medium text-white">
            {mailboxes.length} caixas
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/caixas",
            title: "Caixas de entrada",
            description: `${mailboxes.length}/${entitlement?.maxMailboxes ?? 0} · assinar no Assas`,
          },
          {
            href: "/dominios",
            title: "Domínios",
            description: `${domains.length} · sem limite`,
          },
          {
            href: "/plano",
            title: "Plano e consumo",
            description: `${entitlement?.usedStorageMb ?? 0} MB usados`,
          },
          {
            href: "/financeiro",
            title: "Financeiro",
            description: "Assinaturas e faturas Assas",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-wg-text-muted">{item.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-wg-graphite">
              Abrir <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-display text-xl font-semibold text-wg-graphite">Consumo</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#fafafa] px-4 py-3">
              <p className="text-xs uppercase text-wg-text-muted">Caixas</p>
              <p className="mt-1 font-display text-xl font-semibold">
                {entitlement?.usedMailboxes ?? 0}/{entitlement?.maxMailboxes ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-4 py-3">
              <p className="text-xs uppercase text-wg-text-muted">Domínios</p>
              <p className="mt-1 font-display text-xl font-semibold">
                {entitlement?.usedDomains ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-4 py-3">
              <p className="text-xs uppercase text-wg-text-muted">Chamados</p>
              <p className="mt-1 font-display text-xl font-semibold">{openTickets}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-wg-graphite">
            Assinar caixas
          </h2>
          <p className="mt-2 text-sm text-wg-text-muted">
            Mensal ou anual no cartão via Assas. Sem caixas grátis.
          </p>
          <Link
            href="/caixas"
            className="mt-5 inline-flex rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white"
          >
            Ir para caixas
          </Link>
        </div>
      </section>
    </div>
  );
}
