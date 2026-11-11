import { Resolver } from "node:dns/promises";
import { createAdminClient } from "@/lib/supabase/admin";
import { dnsGuide } from "@/lib/domains/dns-priority";

export type CheckResult = "ok" | "missing" | "wrong";

// Resolvedores públicos, para não depender do cache do servidor.
function resolver() {
  const r = new Resolver({ timeout: 4000, tries: 2 });
  r.setServers(["1.1.1.1", "8.8.8.8"]);
  return r;
}

const clean = (value: string) => value.toLowerCase().replace(/\.$/, "").replace(/\s+/g, " ").trim();

function hostName(name: string, domain: string) {
  const host = clean(name);
  const apex = clean(domain);
  if (!host || host === "@" || host === apex) return apex;
  if (host.endsWith(`.${apex}`)) return host;
  return `${host}.${apex}`;
}

async function txt(r: Resolver, host: string) {
  try {
    return (await r.resolveTxt(host)).map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

/**
 * Confere no DNS público os registros obrigatórios e recomendados de um domínio.
 * Se todos os obrigatórios estiverem certos, marca o domínio como ativo.
 */
export async function checkDomainDns(accountId: string, domainId: string) {
  const admin = createAdminClient();
  const { data: domain } = await admin
    .from("domains")
    .select("id, name, status")
    .eq("id", domainId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!domain) throw new Error("Domínio não encontrado");

  const { data: rows } = await admin
    .from("dns_records")
    .select("type, name, value, ttl, priority")
    .eq("domain_id", domain.id);

  const guide = dnsGuide(rows ?? [], domain.name).filter((row) => row.check);
  const r = resolver();
  const results: Record<string, CheckResult> = {};

  let mx: string[] = [];
  try {
    mx = (await r.resolveMx(domain.name)).map((item) => clean(item.exchange));
  } catch {
    mx = [];
  }
  const rootTxt = await txt(r, domain.name);
  const mailHost = clean(process.env.NEXT_PUBLIC_MAIL_MX_HOST || "mail.webgeele.com.br");
  const mailIps = await r.resolve4(mailHost).catch(() => [] as string[]);

  for (const row of guide) {
    const expected = clean(row.value);
    if (row.check === "mx") {
      results[row.key] = mx.includes(expected) ? (mx.length === 1 ? "ok" : "wrong") : mx.length ? "wrong" : "missing";
    } else if (row.check === "spf") {
      const spf = rootTxt.filter((value) => clean(value).startsWith("v=spf1"));
      // Aceita SPF mesclado com outros serviços, desde que autorize nosso servidor
      // (por mx, pelo nome do servidor ou pelo IP dele).
      const authorizes = (value: string) => {
        const spfValue = clean(value);
        return (
          spfValue === expected ||
          /\s\+?mx(\s|$)/.test(spfValue) ||
          spfValue.includes(`a:${mailHost}`) ||
          mailIps.some((ip) => spfValue.includes(`ip4:${ip}`))
        );
      };
      results[row.key] = !spf.length ? "missing" : spf.length === 1 && authorizes(spf[0]) ? "ok" : "wrong";
    } else if (row.check === "dkim") {
      const found = await txt(r, `${row.name}.${domain.name}`);
      const key = expected.match(/p=([^;\s]+)/)?.[1];
      results[row.key] = !found.length ? "missing" : found.some((v) => key && clean(v).includes(key)) ? "ok" : "wrong";
    } else if (row.check === "dmarc") {
      const found = await txt(r, `_dmarc.${domain.name}`);
      results[row.key] = found.some((v) => clean(v).startsWith("v=dmarc1")) ? "ok" : "missing";
    } else if (row.check === "cname") {
      results[row.key] = await checkCname(r, hostName(row.name, domain.name), expected);
    } else if (row.check === "srv") {
      results[row.key] = await checkSrv(r, hostName(row.name, domain.name), expected);
    } else if (row.check === "txt") {
      const found = await txt(r, hostName(row.name, domain.name));
      results[row.key] = !found.length
        ? "missing"
        : found.some((value) => clean(value).includes(expected))
          ? "ok"
          : "wrong";
    }
  }

  const ready = guide
    .filter((row) => row.level === "required")
    .every((row) => results[row.key] === "ok");

  let status = domain.status as string;
  if (ready && status !== "active") {
    await admin.from("domains").update({ status: "active" }).eq("id", domain.id);
    status = "active";
  }

  return { results, ready, status, checkedAt: new Date().toISOString() };
}

async function checkCname(r: Resolver, host: string, expected: string): Promise<CheckResult> {
  try {
    const found = (await r.resolveCname(host)).map(clean);
    if (!found.length) return "missing";
    return found.includes(expected) ? "ok" : "wrong";
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "ENODATA" && code !== "ENOTFOUND") return "missing";
    const ips = await r.resolve4(host).catch(() => [] as string[]);
    if (!ips.length) return "missing";
    const expectedIps = await r.resolve4(expected).catch(() => [] as string[]);
    return ips.some((ip) => expectedIps.includes(ip)) ? "ok" : "wrong";
  }
}

async function checkSrv(r: Resolver, host: string, expected: string): Promise<CheckResult> {
  let found: Array<{ priority: number; weight: number; port: number; name: string }> = [];
  try {
    found = await r.resolveSrv(host);
  } catch {
    return "missing";
  }
  if (!found.length) return "missing";

  const parts = expected.split(" ");
  if (parts.length < 4) {
    return found.some((item) => clean(item.name) === expected) ? "ok" : "wrong";
  }

  const [priority, weight, port, ...target] = parts;
  const name = clean(target.join(" "));
  const match = found.some(
    (item) =>
      String(item.priority) === priority &&
      String(item.weight) === weight &&
      String(item.port) === port &&
      clean(item.name) === name,
  );
  return match ? "ok" : "wrong";
}
