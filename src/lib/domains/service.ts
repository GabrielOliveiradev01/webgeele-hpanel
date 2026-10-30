import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasClient } from "@/lib/asaas/client";
import { ensureAsaasCustomer } from "@/lib/billing/orders";
import { createStalwartClient } from "@/lib/stalwart/client";
import {
  buildMailDnsSuggestions,
  mapStalwartDnsToSuggestions,
  mergeDnsSuggestions,
  type SuggestedDnsRecord,
} from "@/lib/domains/dns-template";

function normalizeDomain(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listDomains(accountId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("domains")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function ensureStalwartDomain(domainName: string) {
  const stalwart = createStalwartClient();
  if (!stalwart.configured()) return false;

  const list = await stalwart.listDomains();
  const exists = (list.data?.items ?? []).some((item) => item.name === domainName);
  if (!exists) {
    await stalwart.createDomain(domainName);
  }

  // Gera chaves DKIM (Ed25519 + RSA) se ainda não houver registro
  try {
    const dns = await stalwart.getDnsRecords(domainName);
    const hasDkim = (dns.data ?? []).some((row) =>
      row.name.toLowerCase().includes("_domainkey"),
    );
    if (!hasDkim) {
      await Promise.allSettled([
        stalwart.createDkimSignature({ domain: domainName, algorithm: "Ed25519" }),
        stalwart.createDkimSignature({ domain: domainName, algorithm: "Rsa" }),
      ]);
      await sleep(400);
    }
  } catch (err) {
    console.error("Stalwart DKIM create skipped", err);
  }

  return true;
}

async function fetchStalwartDnsSuggestions(domainName: string) {
  const stalwart = createStalwartClient();
  if (!stalwart.configured()) return [] as SuggestedDnsRecord[];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await stalwart.getDnsRecords(domainName);
      const mapped = mapStalwartDnsToSuggestions(response.data ?? [], domainName);
      const hasDkim = mapped.some(
        (row) => row.type === "TXT" && row.name.includes("_domainkey"),
      );
      if (hasDkim || attempt === 2) return mapped;
    } catch (err) {
      if (attempt === 2) {
        console.error("Stalwart DNS fetch failed", err);
        return [];
      }
    }
    await sleep(500);
  }

  return [];
}

async function seedSuggestedDns(
  accountId: string,
  domainId: string,
  domainName: string,
  suggestions: SuggestedDnsRecord[],
) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("dns_records")
    .select("type, name, value")
    .eq("domain_id", domainId);

  const existingKeys = new Set(
    (existing ?? []).map((row) => `${row.type}|${row.name}|${row.value}`),
  );

  const rows = suggestions
    .filter((item) => !existingKeys.has(`${item.type}|${item.name}|${item.value}`))
    .map((item) => ({
      account_id: accountId,
      domain_id: domainId,
      type: item.type,
      name: item.name,
      value: item.value,
      ttl: item.ttl,
      priority: item.priority,
    }));

  if (rows.length) {
    await admin.from("dns_records").insert(rows);
  }

  return suggestions;
}

export async function addExternalDomain(accountId: string, name: string) {
  const domainName = normalizeDomain(name);
  if (!domainName.includes(".")) throw new Error("Domínio inválido");

  // Cria no Stalwart primeiro para já obter DKIM / zona DNS reais
  try {
    await ensureStalwartDomain(domainName);
  } catch (err) {
    console.error("Stalwart domain create skipped", err);
  }

  const fromStalwart = await fetchStalwartDnsSuggestions(domainName);
  const suggestedDns = mergeDnsSuggestions(
    fromStalwart,
    buildMailDnsSuggestions(domainName),
  );

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("domains")
    .insert({
      account_id: accountId,
      name: domainName,
      status: "pending",
      source: "external",
      notes: "Aguardando configuração DNS no provedor do domínio",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Este domínio já está na sua conta");
    throw error;
  }

  await seedSuggestedDns(accountId, data.id, domainName, suggestedDns);

  return { domain: data, suggestedDns };
}

export async function createDomainOrder(input: {
  accountId: string;
  domain: string;
  type: "domain_register" | "domain_transfer";
  authCode?: string;
  billingType?: "PIX" | "BOLETO";
}) {
  const domainName = normalizeDomain(input.domain);
  const unit = input.type === "domain_transfer" ? 4990 : 5990;
  const admin = createAdminClient();
  const customer = await ensureAsaasCustomer(input.accountId);

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      account_id: input.accountId,
      type: input.type,
      quantity: 1,
      unit_price_cents: unit,
      amount_cents: unit,
      status: "pending",
      metadata: {
        domain: domainName,
        authCode: input.authCode || null,
      },
    })
    .select("*")
    .single();

  if (error || !order) throw error || new Error("Falha ao criar pedido de domínio");

  const asaas = createAsaasClient();
  const due = new Date();
  due.setDate(due.getDate() + 1);

  const payment = await asaas.createPayment({
    customer,
    billingType: input.billingType || "PIX",
    value: unit / 100,
    dueDate: due.toISOString().slice(0, 10),
    description:
      input.type === "domain_transfer"
        ? `Transferência de domínio ${domainName}`
        : `Registro de domínio ${domainName}`,
    externalReference: order.id,
  });

  const { data: updated } = await admin
    .from("orders")
    .update({
      asaas_payment_id: payment.id,
      invoice_url: payment.invoiceUrl ?? null,
      bank_slip_url: payment.bankSlipUrl ?? null,
    })
    .eq("id", order.id)
    .select("*")
    .single();

  return updated ?? order;
}

export async function updateDomainNameservers(
  accountId: string,
  domainId: string,
  nameservers: string[],
) {
  const admin = createAdminClient();
  const cleaned = nameservers.map((ns) => ns.trim().toLowerCase()).filter(Boolean);
  const { data, error } = await admin
    .from("domains")
    .update({ nameservers: cleaned })
    .eq("id", domainId)
    .eq("account_id", accountId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
