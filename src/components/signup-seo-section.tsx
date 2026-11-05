import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { MAILBOX_PLANS } from "@/lib/billing/mailbox-pricing";
import { faqs, migrationProviderNames } from "@/lib/site";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Conteúdo em texto para buscadores e assistentes de IA lerem (e citarem) na página de cadastro.
export function SignupSeoSection() {
  return (
    <section className="bg-wg-surface px-3 pb-16 sm:px-5">
      <div className="mx-auto max-w-5xl pt-12">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-wg-graphite">
          Planos de e-mail profissional
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-wg-text-muted">
          Compre caixas de e-mail com o seu domínio, use pelo webmail e gerencie tudo em um só painel.
          Preço por caixa; no plano anual você paga uma vez por ano.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {MAILBOX_PLANS.map((plan) => (
            <article key={plan.code} className="wg-card flex flex-col p-6">
              <h3 className="font-display text-lg font-semibold text-wg-graphite">{plan.name}</h3>
              <p className="mt-1 text-sm text-wg-text-muted">{plan.storageLabel} por caixa</p>
              <p className="mt-5 font-display text-3xl font-semibold text-wg-graphite">
                {brl(Math.round(plan.annualCents / 12))}
                <span className="text-base font-medium text-wg-text-muted">/mês</span>
              </p>
              <p className="mt-1 text-xs text-wg-text-muted">
                no anual ({brl(plan.annualCents)} por ano) · {brl(plan.monthlyCents)} no mensal
              </p>
              <ul className="mt-5 space-y-2 text-sm text-wg-graphite">
                {[
                  `${plan.storageLabel} de armazenamento`,
                  "E-mail com domínio próprio",
                  "Webmail",
                  "Migração do e-mail antigo",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-wg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-wg-text-muted">
          Migração aceita: {migrationProviderNames.join(", ")}.
        </p>

        <h2 className="mt-16 text-center font-display text-2xl font-semibold tracking-tight text-wg-graphite">
          Perguntas frequentes
        </h2>
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group wg-card px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-wg-graphite">
                <h3 className="text-sm sm:text-base">{faq.question}</h3>
                <ChevronDown className="h-4 w-4 shrink-0 text-wg-text-muted transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-wg-text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="#topo" className="wg-btn">
            Criar conta e comprar caixas
          </Link>
        </div>
      </div>
    </section>
  );
}
