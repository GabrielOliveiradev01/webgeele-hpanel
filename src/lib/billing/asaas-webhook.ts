import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapAsaasPaymentToAccountStatus,
  mapAsaasSubscriptionStatus,
} from "@/lib/asaas/client";
import { applySubscriptionGate } from "@/lib/billing/entitlements";
import { fulfillPaidOrder } from "@/lib/billing/orders";

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    subscription?: string;
    status?: string;
    value?: number;
    dueDate?: string;
    externalReference?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    status?: string;
    value?: number;
    nextDueDate?: string;
    externalReference?: string;
  };
};

export async function processAsaasWebhook(payload: AsaasWebhookPayload) {
  const event = payload.event ?? "UNKNOWN";
  const admin = createAdminClient();

  const asaasCustomerId =
    payload.payment?.customer ?? payload.subscription?.customer ?? null;
  const asaasSubscriptionId =
    payload.subscription?.id ?? payload.payment?.subscription ?? null;
  const paymentExternalRef = payload.payment?.externalReference ?? null;

  let accountId: string | null = null;

  if (asaasCustomerId) {
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("asaas_customer_id", asaasCustomerId)
      .maybeSingle();
    accountId = account?.id ?? null;
  }

  if (!accountId && asaasSubscriptionId) {
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("account_id")
      .eq("asaas_subscription_id", asaasSubscriptionId)
      .maybeSingle();
    accountId = subscription?.account_id ?? null;
  }

  if (!accountId && paymentExternalRef) {
    const { data: order } = await admin
      .from("orders")
      .select("account_id")
      .eq("id", paymentExternalRef)
      .maybeSingle();
    accountId = order?.account_id ?? null;
  }

  await admin.from("billing_events").insert({
    account_id: accountId,
    event_type: event,
    asaas_event_id: payload.id ?? null,
    payload,
    processed_at: new Date().toISOString(),
  });

  if (
    (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
    paymentExternalRef
  ) {
    await fulfillPaidOrder(paymentExternalRef);
  }

  if (!accountId) {
    return { ok: true, skipped: true, reason: "account_not_linked" };
  }

  const accountStatus = mapAsaasPaymentToAccountStatus(event);
  if (accountStatus && !paymentExternalRef) {
    await admin
      .from("accounts")
      .update({ status: accountStatus })
      .eq("id", accountId);
  }

  if (asaasSubscriptionId && payload.subscription?.status) {
    await admin
      .from("subscriptions")
      .update({
        status: mapAsaasSubscriptionStatus(payload.subscription.status),
        raw_payload: payload.subscription,
        current_period_end: payload.subscription.nextDueDate
          ? new Date(payload.subscription.nextDueDate).toISOString()
          : null,
      })
      .eq("asaas_subscription_id", asaasSubscriptionId);
  }

  if (
    event === "PAYMENT_OVERDUE" ||
    event === "SUBSCRIPTION_INACTIVATED" ||
    event === "SUBSCRIPTION_DELETED"
  ) {
    await admin
      .from("subscriptions")
      .update({ status: event === "PAYMENT_OVERDUE" ? "past_due" : "blocked" })
      .eq("account_id", accountId)
      .neq("status", "canceled");
  }

  if (
    (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
    !paymentExternalRef
  ) {
    await admin
      .from("subscriptions")
      .update({ status: "active" })
      .eq("account_id", accountId)
      .in("status", ["pending", "past_due", "blocked"]);
  }

  const entitlement = await applySubscriptionGate(accountId);

  return { ok: true, accountId, entitlement };
}
