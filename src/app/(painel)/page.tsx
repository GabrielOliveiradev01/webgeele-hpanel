import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Gauge,
  Globe2,
  HardDrive,
  Headphones,
  Inbox,
  LifeBuoy,
  Network,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireAccount } from "@/lib/auth/account";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { listAccountMailboxes } from "@/lib/mailboxes/service";
import { listDomains } from "@/lib/domains/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/status-badge";
import { LogoMark } from "@/components/logo";

function formatStorage(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace(".", ",")} GB` : `${mb} MB`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <div className="wg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-wg-text-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wg-brand/[0.08] text-wg-brand">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-wg-graphite">
        {value}
      </p>
      {progress !== undefined ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-wg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-wg-brand to-wg-pink"
            style={{ width: `${Math.min(100, Math.max(progress, progress > 0 ? 4 : 0))}%` }}
          />
        </div>
      ) : null}
      <p className="mt-3 text-xs text-wg-text-muted">{detail}</p>
    </div>
  );
}

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

  const maxMailboxes = entitlement?.maxMailboxes ?? 0;
  const usedStorage = entitlement?.usedStorageMb ?? 0;
  const maxStorage = entitlement?.maxStorageMb ?? 0;

  const steps = [
    {
      title: "Cadastre seu domínio",
      description: "Traga um domínio que você já tem ou registre um novo.",
      href: "/dominios",
      done: domains.length > 0,
    },
    {
      title: "Configure o DNS",
      description: "Aponte MX, SPF e DKIM para ativar o correio.",
      href: "/dns",
      done: domains.some((domain) => domain.status === "active"),
    },
    {
      title: "Assine suas caixas",
      description: "Planos mensais ou anuais no cartão via Assas.",
      href: "/caixas",
      done: maxMailboxes > 0,
    },
    {
      title: "Crie a primeira caixa",
      description: "Ex.: contato@suaempresa.com.br",
      href: "/caixas",
      done: mailboxes.length > 0,
    },
  ];
  const doneSteps = steps.filter((step) => step.done).length;

  const shortcuts: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: "/caixas", label: "Caixas", icon: Inbox },
    { href: "/dominios", label: "Domínios", icon: Globe2 },
    { href: "/dns", label: "DNS", icon: Network },
    { href: "/plano", label: "Plano", icon: Gauge },
    { href: "/financeiro", label: "Financeiro", icon: CreditCard },
    { href: "/suporte", label: "Suporte", icon: LifeBuoy },
  ];

  return (
    <div className="space-y-6">
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-wg-brand px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(230,106,175,0.55),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(33,27,58,0.45),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <LogoMark
          color="rgba(255,255,255,0.08)"
          className="pointer-events-none absolute -right-10 -top-16 hidden h-[300px] w-auto md:block"
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {entitlement?.planName ? `Plano ${entitlement.planName}` : "Conta ativa"}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Olá, {name}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/75">
            Caixas por assinatura, domínios ilimitados e DNS do correio. Tudo o que sua
            empresa precisa para ter e-mail profissional.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/caixas"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-wg-brand shadow-[0_8px_20px_rgba(20,10,60,0.25)] transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Assinar caixas
            </Link>
            <Link
              href="/dominios"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
            >
              <Globe2 className="h-4 w-4" />
              Adicionar domínio
            </Link>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-delay-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Caixas de e-mail"
          value={`${mailboxes.length}/${maxMailboxes}`}
          detail={maxMailboxes ? `${maxMailboxes - mailboxes.length} disponíveis` : "Nenhuma caixa assinada"}
          progress={maxMailboxes ? (mailboxes.length / maxMailboxes) * 100 : 0}
        />
        <StatCard
          icon={Globe2}
          label="Domínios"
          value={String(domains.length)}
          detail="Sem limite de quantidade"
        />
        <StatCard
          icon={HardDrive}
          label="Armazenamento"
          value={formatStorage(usedStorage)}
          detail={maxStorage ? `de ${formatStorage(maxStorage)} contratados` : "Sem cota contratada"}
          progress={maxStorage ? (usedStorage / maxStorage) * 100 : 0}
        />
        <StatCard
          icon={Headphones}
          label="Chamados abertos"
          value={String(openTickets)}
          detail={openTickets ? "Aguardando resposta" : "Nenhum chamado pendente"}
        />
      </section>

      <section className="animate-fade-up-delay-2 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="wg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-wg-graphite">
                Primeiros passos
              </h2>
              <p className="mt-1 text-sm text-wg-text-muted">
                Deixe seu e-mail profissional pronto para uso.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-wg-brand/[0.08] px-2.5 py-1 text-xs font-semibold text-wg-brand">
              {doneSteps} de {steps.length}
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-wg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-wg-brand to-wg-pink transition-all"
              style={{ width: `${(doneSteps / steps.length) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Link
                  href={step.href}
                  className="group flex items-center gap-4 rounded-xl border border-transparent px-3 py-3 transition hover:border-wg-border hover:bg-wg-surface/50"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      step.done
                        ? "bg-wg-success text-white"
                        : "border border-wg-border bg-white text-wg-text-muted"
                    }`}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        step.done ? "text-wg-text-muted line-through decoration-wg-text-muted/40" : "text-wg-graphite"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-xs text-wg-text-muted">{step.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-wg-text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="wg-card flex flex-col p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Seus domínios
            </h2>
            <Link href="/dominios" className="text-sm font-semibold text-wg-brand hover:underline">
              Ver todos
            </Link>
          </div>
          {domains.length ? (
            <ul className="mt-4 divide-y divide-wg-border/70">
              {domains.slice(0, 5).map((domain) => (
                <li key={domain.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wg-surface text-wg-text-muted">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-wg-graphite">
                    {domain.name}
                  </span>
                  <StatusBadge
                    status={domain.status}
                    label={domain.status === "pending" ? "Aguardando DNS" : undefined}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-wg-border px-6 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wg-brand/[0.08] text-wg-brand">
                <Globe2 className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-wg-graphite">Nenhum domínio ainda</p>
              <p className="mt-1 text-xs text-wg-text-muted">
                Cadastre um domínio para começar a criar caixas.
              </p>
              <Link href="/dominios" className="wg-btn mt-4 px-3.5 py-2">
                Adicionar domínio
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="animate-fade-up-delay-3">
        <h2 className="mb-3 font-display text-lg font-semibold text-wg-graphite">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="wg-card group flex flex-col items-center gap-3 px-4 py-5 text-center transition hover:-translate-y-0.5 hover:border-wg-brand/30 hover:shadow-[0_12px_30px_rgba(102,60,230,0.12)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wg-surface text-wg-text-muted transition group-hover:bg-wg-brand group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-wg-graphite">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
