import { createAdminClient } from "@/lib/supabase/admin";
import { setAccountMailboxesBlocked } from "@/lib/stalwart/client";
import {
  normalizeMailboxSlots,
  totalMailboxSlots,
  totalStorageFromSlots,
  type MailboxPlanCode,
} from "@/lib/billing/mailbox-pricing";

export type AccountEntitlement = {
  accountId: string;
  entitled: boolean;
  accountStatus: string;
  subscriptionStatus: string | null;
  planCode: string | null;
  planName: string | null;
  planMailboxes: number;
  extraMailboxes: number;
  maxMailboxes: number;
  maxDomains: number | null;
  maxStorageMb: number;
  usedStorageMb: number;
  usedMailboxes: number;
  usedDomains: number;
  mailboxSlots: Record<MailboxPlanCode, number>;
};

const CLOSED_ACCOUNT = new Set(["blocked", "canceled"]);
const CLOSED_SUBSCRIPTION = new Set(["past_due", "blocked", "canceled", "expired"]);

export async function getAccountEntitlement(
  accountId: string,
): Promise<AccountEntitlement | null> {
  const admin = createAdminClient();

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id, status, extra_mailboxes, extra_storage_mb, mailbox_slots")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError) throw accountError;
  if (!account) return null;

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("status, plan:plans(code, name, max_mailboxes, max_domains, max_storage_mb)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) throw subscriptionError;

  const plan = Array.isArray(subscription?.plan)
    ? subscription?.plan[0]
    : subscription?.plan;

  const mailboxSlots = normalizeMailboxSlots(account.mailbox_slots);
  // Compras anteriores aos slots por plano só somavam extra_mailboxes; contam como Start,
  // o mesmo plano padrão usado quando o pedido não informa planCode.
  const legacyMailboxes = (account.extra_mailboxes ?? 0) - totalMailboxSlots(mailboxSlots);
  if (legacyMailboxes > 0) mailboxSlots.start += legacyMailboxes;
  const slotsTotal = totalMailboxSlots(mailboxSlots);
  const extraMailboxes = Math.max(account.extra_mailboxes ?? 0, slotsTotal);
  const maxMailboxes = extraMailboxes;
  const maxStorageMb = Math.max(
    account.extra_storage_mb ?? 0,
    totalStorageFromSlots(mailboxSlots),
  );

  const [{ count: usedMailboxes }, { count: usedDomains }, { data: mailboxRows }] =
    await Promise.all([
      admin
        .from("mailboxes")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId)
        .neq("status", "deleted"),
      admin
        .from("domains")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId),
      admin
        .from("mailboxes")
        .select("quota_mb")
        .eq("account_id", accountId)
        .neq("status", "deleted"),
    ]);

  const used = usedMailboxes ?? 0;
  const usedStorageMb = (mailboxRows ?? []).reduce(
    (sum, row) => sum + (row.quota_mb ?? 0),
    0,
  );

  const subStatus = subscription?.status ?? null;
  const entitled =
    !CLOSED_ACCOUNT.has(account.status) &&
    (!subStatus || !CLOSED_SUBSCRIPTION.has(subStatus));

  return {
    accountId,
    entitled,
    accountStatus: account.status,
    subscriptionStatus: subStatus,
    planCode: plan?.code ?? null,
    planName: plan?.name ?? null,
    planMailboxes: 0,
    extraMailboxes,
    maxMailboxes,
    maxDomains: null,
    maxStorageMb,
    usedStorageMb,
    usedMailboxes: used,
    usedDomains: usedDomains ?? 0,
    mailboxSlots,
  };
}

export async function applySubscriptionGate(accountId: string) {
  const entitlement = await getAccountEntitlement(accountId);
  if (!entitlement) return null;

  const admin = createAdminClient();

  if (!entitlement.entitled) {
    await admin
      .from("mailboxes")
      .update({ status: "blocked", blocked_reason: null })
      .eq("account_id", accountId)
      .neq("status", "deleted");
    await setAccountMailboxesBlocked(accountId, true);
  } else {
    await admin
      .from("mailboxes")
      .update({ status: "active", blocked_reason: null })
      .eq("account_id", accountId)
      .eq("status", "blocked");
    await setAccountMailboxesBlocked(accountId, false);
  }

  return entitlement;
}
