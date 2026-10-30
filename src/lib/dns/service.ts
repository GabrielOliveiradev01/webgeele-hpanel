import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"] as const;

export async function listDnsRecords(accountId: string, domainId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("dns_records")
    .select("*, domain:domains(name)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (domainId) query = query.eq("domain_id", domainId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createDnsRecord(input: {
  accountId: string;
  domainId: string;
  type: string;
  name: string;
  value: string;
  ttl?: number;
  priority?: number | null;
}) {
  if (!ALLOWED.includes(input.type as (typeof ALLOWED)[number])) {
    throw new Error("Tipo de registro DNS inválido");
  }

  const admin = createAdminClient();
  const { data: domain } = await admin
    .from("domains")
    .select("id")
    .eq("id", input.domainId)
    .eq("account_id", input.accountId)
    .maybeSingle();

  if (!domain) throw new Error("Domínio não encontrado");

  const { data, error } = await admin
    .from("dns_records")
    .insert({
      account_id: input.accountId,
      domain_id: input.domainId,
      type: input.type,
      name: input.name.trim(),
      value: input.value.trim(),
      ttl: input.ttl ?? 3600,
      priority: input.priority ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDnsRecord(accountId: string, recordId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("dns_records")
    .delete()
    .eq("id", recordId)
    .eq("account_id", accountId);
  if (error) throw error;
}
