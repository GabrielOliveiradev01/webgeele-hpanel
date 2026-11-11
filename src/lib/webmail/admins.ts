/**
 * Administradores da empresa no webmail. O webmail lê a linha "admins:<domínio>"
 * de public.crm_workspaces no Supabase de perfis (PROFILES_SUPABASE_*), que é
 * outro projeto, separado do banco do painel.
 */

function profilesConfig() {
  const url = (process.env.PROFILES_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.PROFILES_SUPABASE_SECRET_KEY ?? "").trim();
  if (!url || !key) return null;
  return { url, key };
}

export function webmailAdminsEnabled() {
  return profilesConfig() !== null;
}

function adminsKey(domain: string) {
  return `admins:${domain.trim().toLowerCase()}`;
}

async function rest(path: string, init: RequestInit = {}) {
  const config = profilesConfig();
  if (!config) throw new Error("Integração com o webmail não configurada (PROFILES_SUPABASE_URL).");
  return fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function clean(emails: unknown): string[] {
  if (!Array.isArray(emails)) return [];
  return [...new Set(emails.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase()))];
}

/** Admins por domínio; domínios sem linha ficam com lista vazia. */
export async function listDomainAdmins(domains: string[]): Promise<Record<string, string[]>> {
  const names = [...new Set(domains.map((d) => d.trim().toLowerCase()).filter(Boolean))];
  const result: Record<string, string[]> = Object.fromEntries(names.map((d) => [d, []]));
  if (!names.length || !profilesConfig()) return result;
  const keys = names.map((d) => `"${adminsKey(d)}"`).join(",");
  const res = await rest(`/rest/v1/crm_workspaces?select=owner_email,payload&owner_email=in.(${encodeURIComponent(keys)})`);
  if (!res.ok) throw new Error(`Falha ao ler admins do webmail (HTTP ${res.status}).`);
  const rows = (await res.json()) as { owner_email: string; payload: { emails?: unknown } | null }[];
  for (const row of rows) {
    const domain = row.owner_email.slice("admins:".length);
    if (domain in result) result[domain] = clean(row.payload?.emails);
  }
  return result;
}

export async function setDomainAdmins(domain: string, emails: string[]) {
  const name = domain.trim().toLowerCase();
  const res = await rest(`/rest/v1/crm_workspaces?on_conflict=owner_email`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      owner_email: adminsKey(name),
      owner_domain: name,
      payload: { emails: clean(emails), updatedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Falha ao salvar admins no webmail (HTTP ${res.status}).`);
  return clean(emails);
}
