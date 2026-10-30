"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMailboxPlan,
  mailboxCheckoutTotals,
  type MailboxBillingCycle,
  type MailboxPlanCode,
} from "@/lib/billing/mailbox-pricing";

type AccountDefaults = {
  name: string;
  email: string;
  document: string;
  phone: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function MailboxCheckout({
  account,
  initialQuantity,
  initialCycle,
  initialPlan,
}: {
  account: AccountDefaults;
  initialQuantity: number;
  initialCycle: MailboxBillingCycle;
  initialPlan: MailboxPlanCode;
}) {
  const router = useRouter();
  const quantity = Math.max(1, Math.min(50, initialQuantity));
  const cycle = initialCycle;
  const planCode = initialPlan;
  const plan = getMailboxPlan(planCode);

  const [holderName, setHolderName] = useState(account.name);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [ccv, setCcv] = useState("");
  const [holderDoc, setHolderDoc] = useState(account.document);
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [phone, setPhone] = useState(account.phone);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const totals = useMemo(
    () => mailboxCheckoutTotals(quantity, cycle, planCode),
    [quantity, cycle, planCode],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accepted) {
      setError("Aceite os termos para continuar.");
      return;
    }
    setLoading(true);
    setError(null);

    const response = await fetch("/api/mailboxes/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity,
        cycle,
        planCode,
        creditCard: {
          holderName,
          number: cardNumber,
          expiryMonth,
          expiryYear,
          ccv,
        },
        holder: {
          name: holderName,
          email: account.email,
          cpfCnpj: holderDoc,
          postalCode,
          addressNumber,
          phone,
          mobilePhone: phone,
        },
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Não foi possível processar o cartão");
      return;
    }

    if (!payload.paid) {
      setError(
        `Pagamento em análise (${payload.payment?.status || "pendente"}). A cota libera quando o Assas confirmar.`,
      );
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-wg-graphite">
          Assinatura confirmada
        </h1>
        <p className="mt-2 text-sm text-wg-text-muted">
          +{quantity}× {plan.name} · {cycle === "annual" ? "anual" : "mensal"} ·{" "}
          {totals.totalLabel}. Assinatura Assas ativa.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/caixas"
            className="rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white"
          >
            Criar e-mails
          </Link>
          <Link
            href="/financeiro"
            className="rounded-xl border border-black/[0.08] px-4 py-2.5 text-sm font-medium text-wg-graphite"
          >
            Financeiro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wg-graphite text-xs font-semibold text-white">
            1
          </span>
          <span className="text-wg-text-muted">Plano</span>
          <span className="text-wg-text-muted">/</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wg-graphite text-xs font-semibold text-white">
            2
          </span>
          <span className="font-medium text-wg-graphite">Pagamento</span>
          <span className="text-wg-text-muted">/</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.06] text-xs font-semibold text-wg-text-muted">
            3
          </span>
          <span className="text-wg-text-muted">Concluído</span>
        </div>
        <Link href="/caixas" className="text-sm font-medium text-red-600 hover:underline">
          Cancelar
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-6 border-b border-black/[0.06] p-5 sm:p-8 lg:border-r lg:border-b-0">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Assinatura Assas · plano {plan.name} ·{" "}
            {cycle === "monthly" ? "mensal recorrente" : "cobrança única anual"} · só
            cartão.
          </div>

          <section>
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Dados do titular
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1.5 block text-wg-text-muted">Nome completo</span>
                <input
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-wg-text-muted">E-mail</span>
                <input
                  readOnly
                  value={account.email}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#f3f3f4] px-3 py-2.5 text-wg-text-muted"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-wg-text-muted">Telefone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Pagamento no cartão
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1.5 block text-wg-text-muted">Número do cartão</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5 font-mono"
                  placeholder="•••• •••• •••• ••••"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">Mês</span>
                  <input
                    required
                    maxLength={2}
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(onlyDigits(e.target.value).slice(0, 2))}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                    placeholder="MM"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">Ano</span>
                  <input
                    required
                    maxLength={4}
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(onlyDigits(e.target.value).slice(0, 4))}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                    placeholder="AAAA"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">CVV</span>
                  <input
                    required
                    maxLength={4}
                    value={ccv}
                    onChange={(e) => setCcv(onlyDigits(e.target.value).slice(0, 4))}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                    placeholder="•••"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">CPF/CNPJ</span>
                  <input
                    required
                    value={holderDoc}
                    onChange={(e) => setHolderDoc(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">CEP</span>
                  <input
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-wg-text-muted">Número</span>
                  <input
                    required
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
                  />
                </label>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <label className="flex items-start gap-2 text-sm text-wg-text-muted">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              Concordo com a assinatura Assas e a cobrança no cartão informada.
            </span>
          </label>
        </form>

        <aside className="bg-[#fafafa] p-5 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-wg-graphite">Resumo</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-wg-text-muted">Plano</dt>
              <dd className="font-medium text-wg-graphite">{plan.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-wg-text-muted">Quantidade</dt>
              <dd className="font-medium text-wg-graphite">{quantity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-wg-text-muted">Ciclo</dt>
              <dd className="font-medium text-wg-graphite">
                {cycle === "annual" ? "Anual" : "Mensal"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-wg-text-muted">Unitário</dt>
              <dd className="font-medium text-wg-graphite">{money(totals.unitCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-wg-text-muted">Armazenamento</dt>
              <dd className="font-medium text-wg-graphite">
                {quantity} × {plan.storageLabel}
              </dd>
            </div>
            <div className="border-t border-black/[0.06] pt-3">
              <div className="flex justify-between gap-3">
                <dt className="text-wg-text-muted">Total</dt>
                <dd className="font-display text-2xl font-semibold text-wg-graphite">
                  {totals.totalLabel}
                </dd>
              </div>
              <p className="mt-1 text-xs text-wg-text-muted">
                / {totals.periodLabel} · cartão de crédito
              </p>
            </div>
          </dl>

          <button
            type="button"
            disabled={loading}
            onClick={() => document.querySelector("form")?.requestSubmit()}
            className="mt-6 w-full rounded-xl bg-[#5a32ea] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Processando cartão..." : `Pagar ${totals.totalLabel}`}
          </button>
          <p className="mt-3 text-center text-xs text-wg-text-muted">
            Processamento seguro via Assas
          </p>
        </aside>
      </div>
    </div>
  );
}
