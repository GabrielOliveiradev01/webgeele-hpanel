import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasClient } from "@/lib/asaas/client";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const { account } = await requireAccount();
  const admin = createAdminClient();
  const entitlement = account ? await getAccountEntitlement(account.id) : null;

  let subscription = null as {
    status: string;
    asaas_subscription_id: string | null;
    plan?: { name?: string } | null;
  } | null;
  let payments: Array<{
    id: string;
    status: string;
    value: number;
    dueDate: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
  }> = [];
  let orders: Array<{
    id: string;
    type: string;
    quantity: number;
    amount_cents: number;
    status: string;
    invoice_url: string | null;
    created_at: string;
  }> = [];

  if (account) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("status, asaas_subscription_id, plan:plans(name)")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    subscription = sub
      ? {
          status: sub.status,
          asaas_subscription_id: sub.asaas_subscription_id,
          plan: Array.isArray(sub.plan) ? sub.plan[0] : sub.plan,
        }
      : null;

    if (subscription?.asaas_subscription_id) {
      try {
        const asaas = createAsaasClient();
        const list = await asaas.listPaymentsBySubscription(
          subscription.asaas_subscription_id,
        );
        payments = list.data ?? [];
      } catch {
        payments = [];
      }
    }

    const { data: orderRows } = await admin
      .from("orders")
      .select("id, type, quantity, amount_cents, status, invoice_url, created_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(30);
    orders = orderRows ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Assinatura, pedidos de caixas/domínios e cobranças Assas."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-wg-border bg-white p-5">
          <p className="text-xs uppercase text-wg-text-muted">Conta</p>
          <p className="mt-2 font-display text-xl font-semibold">{account?.status ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-wg-border bg-white p-5">
          <p className="text-xs uppercase text-wg-text-muted">Assinatura</p>
          <p className="mt-2 font-display text-xl font-semibold">
            {subscription?.status ?? "—"}
          </p>
          <p className="text-sm text-wg-text-muted">
            {subscription?.plan?.name ?? entitlement?.planName ?? "Sem plano"}
          </p>
        </div>
        <div className="rounded-2xl border border-wg-border bg-white p-5">
          <p className="text-xs uppercase text-wg-text-muted">Acesso</p>
          <p className="mt-2 font-display text-xl font-semibold">
            {entitlement?.entitled ? "Ativo" : "—"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-wg-border bg-white">
        <div className="border-b border-wg-border px-4 py-3">
          <h2 className="font-display text-lg font-semibold">Pedidos do painel</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-wg-border bg-wg-surface/70 text-wg-text-muted">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhum pedido ainda. Compre caixas ou registre domínios.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-wg-border last:border-0">
                  <td className="px-4 py-3">{order.type}</td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">
                    {(order.amount_cents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">
                    {order.invoice_url ? (
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-wg-purple"
                      >
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-2xl border border-wg-border bg-white">
        <div className="border-b border-wg-border px-4 py-3">
          <h2 className="font-display text-lg font-semibold">Cobranças da assinatura</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-wg-border bg-wg-surface/70 text-wg-text-muted">
            <tr>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-wg-text-muted">
                  Sem cobranças de assinatura vinculadas.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-wg-border last:border-0">
                  <td className="px-4 py-3">{payment.dueDate}</td>
                  <td className="px-4 py-3">
                    {payment.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3">
                    {payment.invoiceUrl || payment.bankSlipUrl ? (
                      <a
                        href={payment.invoiceUrl || payment.bankSlipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-wg-purple"
                      >
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
