import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountEntitlement } from "@/lib/billing/entitlements";
import { createStalwartClient } from "@/lib/stalwart/client";
import {
  MAILBOX_PLANS,
  getMailboxPlan,
  type MailboxPlanCode,
} from "@/lib/billing/mailbox-pricing";

function randomPassword() {
  return `Wg${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}!`;
}

export async function listAccountMailboxes(accountId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mailboxes")
    .select("id, email, status, blocked_reason, quota_mb, stalwart_account_id, created_at")
    .eq("account_id", accountId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

function pickAvailablePlanQuota(
  slots: Record<MailboxPlanCode, number>,
  existing: Array<{ quota_mb: number | null }>,
  preferred?: MailboxPlanCode,
) {
  const usedByPlan: Record<MailboxPlanCode, number> = {
    start: 0,
    business: 0,
    professional: 0,
  };

  for (const mailbox of existing) {
    const match = MAILBOX_PLANS.find((plan) => plan.storageMb === mailbox.quota_mb);
    if (match) usedByPlan[match.code] += 1;
  }

  const order: MailboxPlanCode[] = preferred
    ? [preferred, ...MAILBOX_PLANS.map((p) => p.code).filter((c) => c !== preferred)]
    : MAILBOX_PLANS.map((p) => p.code);

  for (const code of order) {
    const available = (slots[code] ?? 0) - usedByPlan[code];
    if (available > 0) return getMailboxPlan(code);
  }

  return null;
}

export async function createMailboxForAccount(input: {
  accountId: string;
  email: string;
  password?: string;
  description?: string;
  planCode?: MailboxPlanCode;
}) {
  const entitlement = await getAccountEntitlement(input.accountId);
  const existing = await listAccountMailboxes(input.accountId);
  const maxMailboxes = entitlement?.maxMailboxes ?? 0;
  if (maxMailboxes <= 0) {
    throw new Error("Nenhuma cota de caixa disponível. Compre uma assinatura Assas para continuar.");
  }
  if (existing.length >= maxMailboxes) {
    throw new Error(
      `Cota de caixas esgotada (${maxMailboxes}). Compre mais caixas para continuar.`,
    );
  }

  const plan = pickAvailablePlanQuota(
    entitlement?.mailboxSlots ?? { start: 0, business: 0, professional: 0 },
    existing,
    input.planCode,
  );
  if (!plan) {
    throw new Error("Não há slot de plano disponível. Compre caixas no Assas.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Informe um e-mail completo, ex.: nome@webgeele.com.br");
  }

  const domain = email.split("@")[1];
  const admin = createAdminClient();

  const { data: accountDomain } = await admin
    .from("domains")
    .select("id, name, status")
    .eq("account_id", input.accountId)
    .eq("name", domain)
    .maybeSingle();

  if (!accountDomain) {
    throw new Error(
      `Domínio ${domain} não está vinculado à sua conta. Cadastre o domínio antes de criar a caixa.`,
    );
  }

  const stalwart = createStalwartClient();
  const domains = await stalwart.listDomains();
  const allowed = (domains.data?.items ?? []).some((item) => item.name === domain);
  if (!allowed) {
    throw new Error(`Domínio ${domain} não está configurado no Stalwart.`);
  }

  const password = input.password || randomPassword();
  const quotaMb = plan.storageMb;
  const quotaBytes = quotaMb * 1024 * 1024;

  const created = await stalwart.createMailbox({
    email,
    password,
    description: input.description || email,
    quotaBytes,
  });

  const { data: mailbox, error } = await admin
    .from("mailboxes")
    .insert({
      account_id: input.accountId,
      domain_id: accountDomain.id,
      local_part: email.split("@")[0],
      email,
      stalwart_account_id: email,
      status: "active",
      quota_mb: quotaMb,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    mailbox,
    password,
    stalwartId: created.data,
    plan,
  };
}
