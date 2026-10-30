import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth/account";
import { MailboxCheckout } from "@/components/mailbox-checkout";
import type {
  MailboxBillingCycle,
  MailboxPlanCode,
} from "@/lib/billing/mailbox-pricing";

export const metadata: Metadata = {
  title: "Checkout · Caixas de entrada",
};

export default async function CaixasCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ qty?: string; cycle?: string; plan?: string }>;
}) {
  const { account } = await requireAccount();
  if (!account) redirect("/login?next=/caixas/checkout");

  const params = await searchParams;
  const quantity = Math.max(1, Math.min(50, Number(params.qty || 1) || 1));
  const cycle: MailboxBillingCycle =
    params.cycle === "annual" ? "annual" : "monthly";
  const plan: MailboxPlanCode =
    params.plan === "business" || params.plan === "professional"
      ? params.plan
      : "start";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-wg-text-muted">
          Caixas de entrada / Checkout
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-wg-graphite">
          Assinatura no cartão
        </h1>
      </div>
      <MailboxCheckout
        initialQuantity={quantity}
        initialCycle={cycle}
        initialPlan={plan}
        account={{
          name: account.legal_name || account.trade_name || account.email || "",
          email: account.email || "",
          document: account.document || "",
          phone: account.phone || "",
        }}
      />
    </div>
  );
}
