import type { Metadata } from "next";
import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { MAILBOX_PLANS } from "@/lib/billing/mailbox-pricing";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Plano e consumo" };

export default async function PlanoPage() {
  const { account } = await requireAccount();
  const entitlement = account ? await getAccountEntitlement(account.id) : null;

  return (
    <div>
      <PageHeader
        title="Plano e consumo"
        description="Caixas por assinatura Assas, armazenamento por quantidade de caixas e domínios ilimitados."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <p className="text-sm text-wg-text-muted">Caixas contratadas</p>
          <p className="mt-2 font-display text-3xl font-semibold text-wg-graphite">
            {entitlement?.usedMailboxes ?? 0} / {entitlement?.maxMailboxes ?? 0}
          </p>
          <p className="mt-2 text-sm text-wg-text-muted">
            Assinaturas Assas: {entitlement?.extraMailboxes ?? 0} · sem cota grátis
          </p>
          <Link href="/caixas" className="mt-4 inline-flex text-sm font-medium text-wg-graphite underline">
            Comprar caixas
          </Link>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <p className="text-sm text-wg-text-muted">Armazenamento</p>
          <p className="mt-2 font-display text-3xl font-semibold text-wg-graphite">
            {entitlement?.usedStorageMb ?? 0} / {entitlement?.maxStorageMb ?? 0} MB
          </p>
          <p className="mt-2 text-sm text-wg-text-muted">
            Soma do armazenamento das caixas contratadas
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <p className="text-sm text-wg-text-muted">Domínios</p>
          <p className="mt-2 font-display text-3xl font-semibold text-wg-graphite">
            {entitlement?.usedDomains ?? 0}
          </p>
          <p className="mt-2 text-sm text-wg-text-muted">Sem limite de quantidade</p>
          <Link href="/dominios" className="mt-4 inline-flex text-sm font-medium text-wg-graphite underline">
            Gerenciar domínios
          </Link>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-sm text-wg-text-muted">Planos de caixa (Assas)</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MAILBOX_PLANS.map((plan) => (
              <div key={plan.code} className="rounded-xl bg-[#fafafa] px-4 py-3">
                <p className="font-medium text-wg-graphite">{plan.name}</p>
                <p className="mt-1 text-sm text-wg-text-muted">
                  {(plan.monthlyCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  /mês ·{" "}
                  {(plan.annualCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  /ano
                </p>
                <p className="mt-1 text-xs text-wg-text-muted">{plan.storageLabel} por caixa</p>
                <p className="mt-2 text-sm font-medium text-wg-graphite">
                  Contratadas: {entitlement?.mailboxSlots?.[plan.code] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
