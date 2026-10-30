"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  MAILBOX_PLANS,
  mailboxCheckoutTotals,
  type MailboxBillingCycle,
  type MailboxPlanCode,
} from "@/lib/billing/mailbox-pricing";

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function BuyMailboxModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [cycle, setCycle] = useState<MailboxBillingCycle>("monthly");
  const [planCode, setPlanCode] = useState<MailboxPlanCode>("start");

  const totals = useMemo(
    () => mailboxCheckoutTotals(quantity, cycle, planCode),
    [quantity, cycle, planCode],
  );

  if (!open) return null;

  function goCheckout() {
    const params = new URLSearchParams({
      qty: String(totals.quantity),
      cycle,
      plan: planCode,
    });
    onClose();
    router.push(`/caixas/checkout?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_60px_rgba(16,24,40,0.18)]">
        <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Escolher plano de e-mail
            </h2>
            <p className="mt-1 text-sm text-wg-text-muted">
              Assinatura Assas no cartão. Depois você finaliza no checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-wg-text-muted hover:bg-black/[0.04]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-2">
            {MAILBOX_PLANS.map((plan) => {
              const selected = planCode === plan.code;
              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setPlanCode(plan.code)}
                  className={`rounded-xl border px-4 py-3 text-left ${
                    selected
                      ? "border-wg-graphite bg-wg-graphite text-white"
                      : "border-black/[0.08] bg-white text-wg-graphite"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className={`mt-1 text-xs ${selected ? "text-white/70" : "text-wg-text-muted"}`}>
                        {plan.storageLabel} por caixa
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{money(plan.monthlyCents)}/mês</p>
                      <p className={`text-xs ${selected ? "text-white/70" : "text-wg-text-muted"}`}>
                        ou {money(plan.annualCents)}/ano
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                cycle === "monthly"
                  ? "border-wg-graphite bg-[#f3f3f4] text-wg-graphite"
                  : "border-black/[0.08] text-wg-text-muted"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("annual")}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                cycle === "annual"
                  ? "border-wg-graphite bg-[#f3f3f4] text-wg-graphite"
                  : "border-black/[0.08] text-wg-text-muted"
              }`}
            >
              Anual
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-wg-text-muted">Quantidade de caixas</span>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5"
            />
          </label>

          <div className="rounded-xl bg-[#fafafa] px-4 py-3 text-sm text-wg-text-muted">
            <p>
              Total: <strong className="text-wg-graphite">{totals.totalLabel}</strong> /{" "}
              {totals.periodLabel}
            </p>
            <p className="mt-1">
              Armazenamento:{" "}
              <strong className="text-wg-graphite">
                {totals.quantity} × {totals.storageLabel}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-wg-text-muted hover:bg-black/[0.04]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={goCheckout}
            className="rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white"
          >
            Ir para o checkout
          </button>
        </div>
      </div>
    </div>
  );
}
