import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Globe2,
  MessageCircle,
  Network,
  Package,
  Sparkles,
} from "lucide-react";

const quickActions = [
  {
    href: "/servicos",
    title: "Meus serviços",
    description: "Veja o que está ativo na sua conta",
    icon: Package,
    accent: "from-wg-purple/15 to-wg-purple/5",
  },
  {
    href: "/dominios",
    title: "Domínios",
    description: "Gerencie registros e renovações",
    icon: Globe2,
    accent: "from-wg-pink/15 to-wg-pink/5",
  },
  {
    href: "/dns",
    title: "DNS",
    description: "Ajuste apontamentos e registros",
    icon: Network,
    accent: "from-wg-purple/12 to-wg-pink/8",
  },
  {
    href: "/financeiro",
    title: "Financeiro",
    description: "Faturas, pagamentos e histórico",
    icon: CreditCard,
    accent: "from-[#211b3a]/08 to-wg-purple/8",
  },
];

const activity = [
  {
    title: "Fatura #10482 gerada",
    detail: "Plano Business — vencimento em 10/11/2026",
    time: "Hoje",
    tone: "billing",
  },
  {
    title: "DNS atualizado",
    detail: "empresa.com.br — registro A alterado",
    time: "Ontem",
    tone: "dns",
  },
  {
    title: "Domínio renovado",
    detail: "loja.empresa.com.br renovado por 1 ano",
    time: "3 dias",
    tone: "domain",
  },
  {
    title: "Chamado #8821 respondido",
    detail: "Suporte respondeu sua solicitação de SSL",
    time: "5 dias",
    tone: "support",
  },
];

export function OverviewPage() {
  return (
    <div className="space-y-8">
      <section className="animate-fade-up flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-wg-purple">Bom dia, Maria</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-wg-graphite sm:text-[2.15rem]">
            Visão geral da sua conta
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-wg-text-muted">
            Acompanhe serviços contratados, domínios, consumo e financeiro em um só lugar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-wg-border bg-white px-3.5 py-2 text-sm text-wg-graphite shadow-sm">
            <span className="h-2 w-2 rounded-full bg-wg-success" />
            Conta ativa
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-wg-graphite px-3.5 py-2 text-sm font-medium text-white">
            Plano Business
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-wg-purple to-wg-pink px-3.5 py-2 text-sm font-medium text-white">
            3 serviços
          </span>
        </div>
      </section>

      <section className="animate-fade-up-delay-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl border border-wg-border bg-white p-5 shadow-[0_10px_30px_rgba(33,27,58,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-wg-purple/30 hover:shadow-[0_16px_40px_rgba(113,89,233,0.12)]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition group-hover:opacity-100`}
              />
              <div className="relative">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-wg-graphite text-white transition group-hover:bg-gradient-to-br group-hover:from-wg-purple group-hover:to-wg-pink">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2 className="font-display text-lg font-semibold text-wg-graphite">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-wg-text-muted">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-wg-purple">
                  Abrir
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="animate-fade-up-delay-2 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-wg-border bg-white p-6 shadow-[0_10px_30px_rgba(33,27,58,0.04)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-wg-graphite">
                Atividade recente
              </h2>
              <p className="mt-1 text-sm text-wg-text-muted">
                Últimas movimentações da sua conta WebGeele
              </p>
            </div>
            <Link
              href="/financeiro"
              className="hidden text-sm font-medium text-wg-purple hover:text-wg-graphite sm:inline"
            >
              Ver tudo
            </Link>
          </div>

          <ul className="divide-y divide-wg-border">
            {activity.map((item) => (
              <li key={item.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  className={[
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    item.tone === "billing" && "bg-wg-purple/12 text-wg-purple",
                    item.tone === "dns" && "bg-wg-pink/12 text-wg-pink",
                    item.tone === "domain" && "bg-wg-graphite/8 text-wg-graphite",
                    item.tone === "support" && "bg-wg-success/12 text-wg-success",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.tone === "billing" ? <FileText className="h-4 w-4" /> : null}
                  {item.tone === "dns" ? <Network className="h-4 w-4" /> : null}
                  {item.tone === "domain" ? <Globe2 className="h-4 w-4" /> : null}
                  {item.tone === "support" ? <MessageCircle className="h-4 w-4" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-wg-graphite">{item.title}</p>
                    <span className="shrink-0 text-xs font-medium text-wg-text-muted">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-wg-text-muted">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-wg-border bg-white p-6 shadow-[0_10px_30px_rgba(33,27,58,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-wg-purple to-wg-pink text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-wg-graphite">
                  Precisa de ajuda?
                </h2>
                <p className="text-sm text-wg-text-muted">Suporte WebGeele</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-wg-text-muted">
              Abra uma solicitação ou consulte o status dos seus chamados. A equipe responde em
              horário comercial.
            </p>
            <Link
              href="/suporte"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white transition hover:bg-wg-graphite-soft"
            >
              Ir para o suporte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-wg-graphite p-6 text-white shadow-[0_16px_40px_rgba(33,27,58,0.22)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(230,106,175,0.35),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(113,89,233,0.4),transparent_42%)]" />
            <div className="relative">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                <Sparkles className="h-3.5 w-3.5 text-wg-pink" />
                Novidade
              </span>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Organize seu perfil empresarial
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Complete os dados da empresa e prepare o diretório. São módulos próprios, separados
                do painel de serviços.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/perfil-empresarial"
                  className="inline-flex items-center rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-wg-graphite transition hover:bg-white/90"
                >
                  Perfil empresarial
                </Link>
                <Link
                  href="/diretorio"
                  className="inline-flex items-center rounded-xl border border-white/20 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Diretório
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-delay-3 overflow-hidden rounded-2xl border border-wg-border bg-white shadow-[0_10px_30px_rgba(33,27,58,0.04)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-medium text-wg-pink">Resumo do plano</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
              Business — consumo sob controle
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-wg-text-muted">
              Acompanhe utilização, limites e próximos vencimentos sem sair do painel do cliente.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Domínios", value: "4 / 10" },
                { label: "Serviços", value: "3 ativos" },
                { label: "Próxima fatura", value: "R$ 189,90" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-wg-border bg-wg-surface/70 px-4 py-3"
                >
                  <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-wg-graphite">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/plano"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-wg-purple hover:text-wg-graphite"
            >
              Ver plano e consumo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[220px] bg-gradient-to-br from-wg-purple via-[#5f4ad4] to-wg-pink p-6 sm:p-8">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.45)_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-between text-white">
              <div>
                <p className="text-sm text-white/75">Status financeiro</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">Em dia</p>
                <p className="mt-2 max-w-xs text-sm text-white/75">
                  Nenhuma fatura em atraso. Próximo vencimento em 10/11/2026.
                </p>
              </div>
              <Link
                href="/financeiro"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25"
              >
                Abrir financeiro
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
