import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { createAsaasClient } from "@/lib/asaas/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id, status, asaas_customer_id, email, legal_name")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ account: null, entitlement: null });
  }

  const entitlement = await getAccountEntitlement(account.id);

  const { data: subscription } = await admin
    .from("subscriptions")
    .select(
      "id, status, asaas_subscription_id, current_period_end, plan:plans(code, name, price_cents, max_mailboxes)",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let payments: unknown[] = [];
  if (subscription?.asaas_subscription_id) {
    try {
      const asaas = createAsaasClient();
      const list = await asaas.listPaymentsBySubscription(
        subscription.asaas_subscription_id,
      );
      payments = list.data ?? [];
    } catch (error) {
      console.error("Failed to list Asaas payments", error);
    }
  }

  return NextResponse.json({
    account,
    entitlement,
    subscription,
    payments,
  });
}
