import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasClient } from "@/lib/asaas/client";
import { createStalwartClient } from "@/lib/stalwart/client";

function tomorrowISODate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const SANDBOX_CPF = "24971563792";

function isAsaasSandbox() {
  return (process.env.ASAAS_API_URL || "").includes("sandbox");
}

export async function ensureAsaasCustomer(accountId: string) {
  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();
  if (error || !account) throw error || new Error("Conta não encontrada");

  if (account.asaas_customer_id) return account.asaas_customer_id as string;

  const asaas = createAsaasClient();
  const existing = await asaas.findCustomersByEmail(account.email);
  const found = existing.data?.[0];
  if (found?.id) {
    await admin
      .from("accounts")
      .update({ asaas_customer_id: found.id })
      .eq("id", accountId);
    return found.id;
  }

  const document =
    (account.document as string | null)?.replace(/\D/g, "") ||
    (isAsaasSandbox() ? SANDBOX_CPF : undefined);

  if (!document) {
    throw new Error(
      "Informe o CPF/CNPJ em Minha conta antes de gerar cobrança no Assas.",
    );
  }

  const created = await asaas.createCustomer({
    name: account.legal_name || account.trade_name || account.email,
    email: account.email,
    cpfCnpj: document,
    phone: account.phone || undefined,
    externalReference: account.id,
  });

  await admin
    .from("accounts")
    .update({ asaas_customer_id: created.id })
    .eq("id", accountId);

  return created.id;
}

export type MailboxCardCheckoutInput = {
  accountId: string;
  quantity: number;
  cycle: "monthly" | "annual";
  planCode: "start" | "business" | "professional";
  remoteIp?: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holder: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
    mobilePhone?: string;
  };
};

export async function createExtraMailboxOrder(input: MailboxCardCheckoutInput) {
  const { mailboxCheckoutTotals, getMailboxPlan } = await import(
    "@/lib/billing/mailbox-pricing"
  );
  const admin = createAdminClient();
  const plan = getMailboxPlan(input.planCode);
  const totals = mailboxCheckoutTotals(input.quantity, input.cycle, plan.code);
  const customer = await ensureAsaasCustomer(input.accountId);

  const cardNumber = input.creditCard.number.replace(/\D/g, "");
  const cpfCnpj = input.holder.cpfCnpj.replace(/\D/g, "");
  const postalCode = input.holder.postalCode.replace(/\D/g, "");

  if (cardNumber.length < 13) throw new Error("Número do cartão inválido");
  if (!cpfCnpj || cpfCnpj.length < 11) throw new Error("CPF/CNPJ do titular inválido");
  if (postalCode.length < 8) throw new Error("CEP do titular inválido");

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      account_id: input.accountId,
      type: "extra_mailbox",
      quantity: totals.quantity,
      unit_price_cents: totals.unitCents,
      amount_cents: totals.amountCents,
      status: "pending",
      metadata: {
        billingType: "CREDIT_CARD",
        cycle: input.cycle,
        planCode: plan.code,
        planName: plan.name,
        storageMb: plan.storageMb,
        unitMonthlyCents: plan.monthlyCents,
        unitAnnualCents: plan.annualCents,
      },
    })
    .select("*")
    .single();

  if (error || !order) throw error || new Error("Falha ao criar pedido");

  const asaas = createAsaasClient();
  const rawYear = String(input.creditCard.expiryYear).replace(/\D/g, "");
  const expiryYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const creditCard = {
    holderName: input.creditCard.holderName.trim(),
    number: cardNumber,
    expiryMonth: input.creditCard.expiryMonth.replace(/\D/g, "").padStart(2, "0"),
    expiryYear,
    ccv: input.creditCard.ccv.replace(/\D/g, ""),
  };

  const holderInfo = {
    name: input.holder.name.trim(),
    email: input.holder.email.trim(),
    cpfCnpj,
    postalCode,
    addressNumber: input.holder.addressNumber.trim() || "0",
    phone: input.holder.phone?.replace(/\D/g, "") || undefined,
    mobilePhone:
      input.holder.mobilePhone?.replace(/\D/g, "") ||
      input.holder.phone?.replace(/\D/g, "") ||
      undefined,
  };

  const description =
    input.cycle === "annual"
      ? `${totals.quantity}× ${plan.name} WebGeele — anual`
      : `${totals.quantity}× ${plan.name} WebGeele — mensal`;

  try {
    if (input.cycle === "monthly") {
      const subscription = await asaas.createSubscription({
        customer,
        billingType: "CREDIT_CARD",
        value: totals.amountReais,
        nextDueDate: tomorrowISODate(),
        cycle: "MONTHLY",
        description,
        externalReference: order.id,
        creditCard,
        creditCardHolderInfo: holderInfo,
        remoteIp: input.remoteIp,
      });

      const paidStatuses = new Set(["ACTIVE", "CONFIRMED", "RECEIVED"]);
      const confirmed = paidStatuses.has(String(subscription.status).toUpperCase());

      const { data: updated } = await admin
        .from("orders")
        .update({
          asaas_payment_id: subscription.id,
          invoice_url: subscription.invoiceUrl ?? null,
          metadata: {
            ...((order.metadata as Record<string, unknown> | null) ?? {}),
            billingType: "CREDIT_CARD",
            cycle: "monthly",
            planCode: plan.code,
            asaasSubscriptionId: subscription.id,
            asaasPaymentStatus: subscription.status,
          },
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (confirmed) {
        await fulfillPaidOrder(order.id);
      }

      return {
        order: confirmed
          ? { ...(updated ?? order), status: "paid" }
          : updated ?? order,
        payment: {
          id: subscription.id,
          status: subscription.status,
          value: subscription.value,
          billingType: "CREDIT_CARD" as const,
          cycle: "monthly" as const,
          invoiceUrl: subscription.invoiceUrl ?? null,
          kind: "subscription" as const,
        },
        plan,
        unitPriceCents: totals.unitCents,
        quantity: totals.quantity,
        amountCents: totals.amountCents,
        paid: confirmed,
      };
    }

    const payment = await asaas.createPayment({
      customer,
      billingType: "CREDIT_CARD",
      value: totals.amountReais,
      dueDate: tomorrowISODate(),
      description,
      externalReference: order.id,
      creditCard,
      creditCardHolderInfo: holderInfo,
      remoteIp: input.remoteIp,
    });

    const confirmed = ["CONFIRMED", "RECEIVED"].includes(
      String(payment.status).toUpperCase(),
    );

    const { data: updated } = await admin
      .from("orders")
      .update({
        asaas_payment_id: payment.id,
        invoice_url: payment.invoiceUrl ?? null,
        metadata: {
          ...((order.metadata as Record<string, unknown> | null) ?? {}),
          billingType: "CREDIT_CARD",
          cycle: "annual",
          planCode: plan.code,
          asaasPaymentStatus: payment.status,
        },
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (confirmed) {
      await fulfillPaidOrder(order.id);
    }

    return {
      order: confirmed
        ? { ...(updated ?? order), status: "paid" }
        : updated ?? order,
      payment: {
        id: payment.id,
        status: payment.status,
        value: payment.value,
        billingType: "CREDIT_CARD" as const,
        cycle: "annual" as const,
        invoiceUrl: payment.invoiceUrl ?? null,
        kind: "payment" as const,
      },
      plan,
      unitPriceCents: totals.unitCents,
      quantity: totals.quantity,
      amountCents: totals.amountCents,
      paid: confirmed,
    };
  } catch (err) {
    await admin
      .from("orders")
      .update({
        status: "canceled",
        metadata: {
          ...((order.metadata as Record<string, unknown> | null) ?? {}),
          error: err instanceof Error ? err.message : "Falha no cartão",
        },
      })
      .eq("id", order.id);
    throw err;
  }
}

export async function fulfillPaidOrder(orderId: string) {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order || order.status === "paid") return order;

  if (order.type === "extra_mailbox") {
    const {
      getMailboxPlan,
      normalizeMailboxSlots,
    } = await import("@/lib/billing/mailbox-pricing");
    const planCode = String(order.metadata?.planCode || "start");
    const plan = getMailboxPlan(planCode);

    const { data: account } = await admin
      .from("accounts")
      .select("extra_mailboxes, extra_storage_mb, mailbox_slots")
      .eq("id", order.account_id)
      .single();

    const slots = normalizeMailboxSlots(account?.mailbox_slots);
    slots[plan.code] = (slots[plan.code] ?? 0) + order.quantity;

    await admin
      .from("accounts")
      .update({
        extra_mailboxes: (account?.extra_mailboxes ?? 0) + order.quantity,
        extra_storage_mb:
          (account?.extra_storage_mb ?? 0) + order.quantity * plan.storageMb,
        mailbox_slots: slots,
      })
      .eq("id", order.account_id);
  }

  if (order.type === "domain_register" || order.type === "domain_transfer") {
    const domainName = String(order.metadata?.domain || "");
    if (domainName) {
      const { addExternalDomain } = await import("@/lib/domains/service");
      // Reusa fluxo de domínio + DNS sugeridos quando ainda não existe
      const { data: existingDomain } = await admin
        .from("domains")
        .select("id")
        .eq("account_id", order.account_id)
        .eq("name", domainName)
        .maybeSingle();

      if (!existingDomain) {
        await addExternalDomain(order.account_id, domainName);
      }

      await admin
        .from("domains")
        .update({
          status: "pending",
          source: order.type === "domain_transfer" ? "transferred" : "registered",
          auth_code: order.metadata?.authCode || null,
          notes: "Aguardando configuração DNS no provedor do domínio",
        })
        .eq("account_id", order.account_id)
        .eq("name", domainName);

      try {
        const stalwart = createStalwartClient();
        const list = await stalwart.listDomains();
        const exists = (list.data?.items ?? []).some((item) => item.name === domainName);
        if (!exists) {
          await fetch(
            `${process.env.STALWART_API_URL?.replace(/\/$/, "")}/api/principal`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.STALWART_API_USER}:${process.env.STALWART_API_PASSWORD}`).toString("base64")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "domain",
                name: domainName,
                description: domainName,
              }),
            },
          );
        }
      } catch (err) {
        console.error("Stalwart domain sync failed", err);
      }
    }
  }

  const { data: paid } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .select("*")
    .single();

  return paid;
}

/** Homologação: marca pedido pago sem esperar webhook (sandbox). */
export async function markOrderPaidLocally(orderId: string, accountId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, account_id")
    .eq("id", orderId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (!order) throw new Error("Pedido não encontrado");
  return fulfillPaidOrder(orderId);
}
