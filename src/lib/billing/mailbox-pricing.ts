export type MailboxBillingCycle = "monthly" | "annual";

export type MailboxPlanCode = "start" | "business" | "professional";

export type MailboxPlan = {
  code: MailboxPlanCode;
  name: string;
  monthlyCents: number;
  annualCents: number;
  storageMb: number;
  storageLabel: string;
};

export const MAILBOX_PLANS: MailboxPlan[] = [
  {
    code: "start",
    name: "Start",
    monthlyCents: 990,
    annualCents: 9900,
    storageMb: 2 * 1024,
    storageLabel: "2 GB",
  },
  {
    code: "business",
    name: "Business",
    monthlyCents: 1490,
    annualCents: 14990,
    storageMb: 5 * 1024,
    storageLabel: "5 GB",
  },
  {
    code: "professional",
    name: "Profissional",
    monthlyCents: 2490,
    annualCents: 24990,
    storageMb: 15 * 1024,
    storageLabel: "15 GB",
  },
];

/** @deprecated use plan pricing */
export const MAILBOX_MONTHLY_CENTS = MAILBOX_PLANS[0].monthlyCents;
export const STORAGE_MB_PER_MAILBOX = MAILBOX_PLANS[0].storageMb;

export function getMailboxPlan(code: string | null | undefined): MailboxPlan {
  return (
    MAILBOX_PLANS.find((plan) => plan.code === code) ?? MAILBOX_PLANS[0]
  );
}

export function mailboxCheckoutTotals(
  quantity: number,
  cycle: MailboxBillingCycle,
  planCode: MailboxPlanCode = "start",
) {
  const plan = getMailboxPlan(planCode);
  const qty = Math.max(1, Math.min(50, quantity));
  const unitCents = cycle === "annual" ? plan.annualCents : plan.monthlyCents;
  const amountCents = unitCents * qty;

  return {
    quantity: qty,
    cycle,
    plan,
    unitMonthlyCents: plan.monthlyCents,
    unitAnnualCents: plan.annualCents,
    unitCents,
    amountCents,
    amountReais: amountCents / 100,
    storageMb: qty * plan.storageMb,
    storageLabel: plan.storageLabel,
    monthlyLabel: (plan.monthlyCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    annualLabel: (plan.annualCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    totalLabel: (amountCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    periodLabel: cycle === "annual" ? "ano" : "mês",
  };
}

export function storageMbForMailboxes(count: number, planCode: MailboxPlanCode = "start") {
  return Math.max(0, count) * getMailboxPlan(planCode).storageMb;
}

export type MailboxSlots = Partial<Record<MailboxPlanCode, number>>;

export function emptyMailboxSlots(): Record<MailboxPlanCode, number> {
  return { start: 0, business: 0, professional: 0 };
}

export function normalizeMailboxSlots(raw: unknown): Record<MailboxPlanCode, number> {
  const base = emptyMailboxSlots();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  for (const plan of MAILBOX_PLANS) {
    const value = Number(data[plan.code] ?? 0);
    base[plan.code] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  return base;
}

export function totalMailboxSlots(slots: MailboxSlots) {
  return MAILBOX_PLANS.reduce((sum, plan) => sum + (slots[plan.code] ?? 0), 0);
}

export function totalStorageFromSlots(slots: MailboxSlots) {
  return MAILBOX_PLANS.reduce(
    (sum, plan) => sum + (slots[plan.code] ?? 0) * plan.storageMb,
    0,
  );
}
