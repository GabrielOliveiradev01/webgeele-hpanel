export type SuggestedDnsRecord = {
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "TLSA";
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  purpose: string;
};

type StalwartDnsLike = {
  type: string;
  name: string;
  content: string;
};

function mxHost() {
  return (
    process.env.NEXT_PUBLIC_MAIL_MX_HOST ||
    process.env.MAIL_MX_HOST ||
    "mail.webgeele.com.br"
  );
}

function cleanDnsValue(value: string) {
  return value
    .replace(/\s+Copiar\.?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

function relativeHost(fqdn: string, domain: string) {
  const host = fqdn.replace(/\.$/, "").toLowerCase();
  const apex = domain.replace(/\.$/, "").toLowerCase();
  if (host === apex) return "@";
  if (host.endsWith(`.${apex}`)) return host.slice(0, -(apex.length + 1));
  return host;
}

function purposeFor(type: string, name: string, value: string): string {
  const host = name.toLowerCase();
  const content = value.toLowerCase();

  if (type === "MX") return "Recebimento de e-mail (Stalwart)";
  if (type === "TXT" && host.includes("_domainkey")) return "DKIM — assinatura de envio";
  if (type === "TXT" && (host === "_dmarc" || host.startsWith("_dmarc."))) {
    return "DMARC — política de autenticação";
  }
  if (type === "TXT" && (host === "@" || !host.includes(".")) && content.includes("v=spf1")) {
    return "SPF — autenticação de envio";
  }
  if (type === "TXT" && host.includes("_mta-sts")) return "MTA-STS — política de transporte";
  if (type === "TXT" && host.includes("_smtp._tls")) return "TLS-RPT — relatórios TLS";
  if (type === "CNAME" && host.startsWith("autoconfig")) {
    return "Autoconfig de clientes de e-mail";
  }
  if (type === "CNAME" && host.startsWith("autodiscover")) {
    return "Autodiscover (Outlook e similares)";
  }
  if (type === "CNAME" && (host === "mail" || host.startsWith("mail."))) {
    return "Atalho mail.seudominio → servidor WebGeele";
  }
  if (type === "CNAME" && host.startsWith("mta-sts")) return "MTA-STS — host de política";
  if (type === "SRV") return "Descoberta de serviços de e-mail";
  return "Registro DNS do correio WebGeele";
}

function isCustomerFacing(type: string, name: string) {
  const t = type.toUpperCase();
  if (t === "TLSA") return false;
  if (t === "SRV") {
    // Mantém só os mais úteis para o cliente configurar
    return (
      name.startsWith("_imaps.") ||
      name.startsWith("_submissions.") ||
      name.startsWith("_submission.")
    );
  }
  return ["MX", "TXT", "CNAME"].includes(t);
}

/** Converte registros do Stalwart (/api/dns/records) para a tabela do painel */
export function mapStalwartDnsToSuggestions(
  records: StalwartDnsLike[],
  domain: string,
): SuggestedDnsRecord[] {
  const mapped: SuggestedDnsRecord[] = [];

  for (const record of records) {
    const type = record.type.toUpperCase() as SuggestedDnsRecord["type"];
    const name = relativeHost(record.name, domain);
    if (!isCustomerFacing(type, name)) continue;

    let value = cleanDnsValue(record.content);
    let priority: number | null = null;

    if (type === "MX") {
      const parts = value.split(" ");
      const maybePriority = Number(parts[0]);
      if (Number.isFinite(maybePriority) && parts.length >= 2) {
        priority = maybePriority;
        value = parts.slice(1).join(" ");
      }
    }

    if (type === "SRV") {
      // Formato Stalwart: "prio weight port host" — guardamos o content limpo
      const parts = value.split(" ");
      if (parts.length >= 4 && Number.isFinite(Number(parts[0]))) {
        priority = Number(parts[0]);
      }
    }

    mapped.push({
      type,
      name,
      value,
      ttl: 3600,
      priority,
      purpose: purposeFor(type, name, value),
    });
  }

  return mapped;
}

/** DNS recomendados (fallback) quando o Stalwart ainda não devolveu a zona */
export function buildMailDnsSuggestions(domain: string): SuggestedDnsRecord[] {
  const host = mxHost();

  return [
    {
      type: "MX",
      name: "@",
      value: host,
      ttl: 3600,
      priority: 10,
      purpose: "Recebimento de e-mail (Stalwart)",
    },
    {
      type: "TXT",
      name: "@",
      value: `v=spf1 mx a:${host} ~all`,
      ttl: 3600,
      priority: null,
      purpose: "SPF — autenticação de envio",
    },
    {
      type: "TXT",
      name: "_dmarc",
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      ttl: 3600,
      priority: null,
      purpose: "DMARC — política de autenticação",
    },
    {
      type: "CNAME",
      name: "autoconfig",
      value: host,
      ttl: 3600,
      priority: null,
      purpose: "Autoconfig de clientes de e-mail",
    },
    {
      type: "CNAME",
      name: "autodiscover",
      value: host,
      ttl: 3600,
      priority: null,
      purpose: "Autodiscover (Outlook e similares)",
    },
    {
      type: "CNAME",
      name: "mail",
      value: host,
      ttl: 3600,
      priority: null,
      purpose: "Atalho mail.seudominio → servidor WebGeele",
    },
  ];
}

export function mergeDnsSuggestions(
  primary: SuggestedDnsRecord[],
  fallback: SuggestedDnsRecord[],
): SuggestedDnsRecord[] {
  const keys = new Set(primary.map((row) => `${row.type}|${row.name}`));
  const merged = [...primary];
  for (const row of fallback) {
    if (!keys.has(`${row.type}|${row.name}`)) merged.push(row);
  }
  return merged;
}
