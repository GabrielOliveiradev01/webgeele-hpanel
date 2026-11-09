// Organiza os registros de DNS do e-mail por importância, para o cliente saber
// o que é indispensável. Usado no navegador (Domínios → Ver DNS) e na verificação.

export type DnsLevel = "required" | "recommended" | "optional";

export type DnsRecordInput = {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
};

export type DnsCheck = "spf" | "mx" | "dkim" | "dmarc";

export type DnsGuideRow = DnsRecordInput & {
  key: string;
  level: DnsLevel;
  title: string;
  help: string;
  /** Qual verificação ao vivo vale para este registro (só obrigatórios e recomendados). */
  check?: DnsCheck;
  /** Campos separados para o formulário de SRV dos provedores. */
  srv?: { priority: string; weight: string; port: string; target: string };
};

export const LEVELS: Record<DnsLevel, { label: string; description: string }> = {
  required: {
    label: "Obrigatórios",
    description: "Sem estes registros o e-mail não recebe mensagens ou cai no spam.",
  },
  recommended: {
    label: "Recomendado",
    description: "Protege o domínio contra falsificação e melhora a entrega.",
  },
  optional: {
    label: "Opcionais",
    description: "Facilitam configurar o e-mail no celular, no Outlook e em outros aplicativos.",
  },
};

const ORDER: DnsLevel[] = ["required", "recommended", "optional"];

function classify(row: DnsRecordInput): Omit<DnsGuideRow, keyof DnsRecordInput | "key"> {
  const type = row.type.toUpperCase();
  const name = row.name.toLowerCase();
  const value = row.value.toLowerCase();

  if (type === "MX") {
    return {
      level: "required",
      title: "Receber e-mails (MX)",
      help: "Apague os outros registros MX do domínio, senão parte das mensagens vai para o provedor antigo.",
      check: "mx",
    };
  }
  if (type === "TXT" && name === "@" && value.startsWith("v=spf1")) {
    return {
      level: "required",
      title: "Autorizar o envio (SPF)",
      help: "Só pode existir um TXT com v=spf1. Se o domínio já tiver um, substitua pelo nosso.",
      check: "spf",
    };
  }
  if (type === "TXT" && name.includes("_domainkey")) {
    return {
      level: "required",
      title: "Assinatura de envio (DKIM)",
      help: "Copie o valor inteiro, sem quebras de linha. São dois registros DKIM: cadastre os dois.",
      check: "dkim",
    };
  }
  if (type === "TXT" && name === "_dmarc") {
    return {
      level: "recommended",
      title: "Política anti-falsificação (DMARC)",
      help: "Comece com p=none. Depois que tudo estiver funcionando, dá para endurecer a política.",
      check: "dmarc",
    };
  }
  if (type === "SRV") {
    return {
      level: "optional",
      title: "Configuração automática de aplicativos (SRV)",
      help: "No provedor, preencha prioridade, peso, porta e destino separadamente.",
    };
  }
  if (type === "CNAME" && (name === "autoconfig" || name === "autodiscover")) {
    return {
      level: "optional",
      title: name === "autodiscover" ? "Configuração automática do Outlook" : "Configuração automática (Thunderbird e outros)",
      help: "Deixa o aplicativo descobrir o servidor sozinho.",
    };
  }
  if (type === "CNAME" && name === "mail") {
    return {
      level: "optional",
      title: "Atalho mail.seudominio",
      help: "Só crie se ainda não existir um registro mail no domínio.",
    };
  }
  return {
    level: "optional",
    title: name.includes("mta-sts") ? "Segurança no transporte (MTA-STS)" : name.includes("_smtp._tls") ? "Relatórios de entrega (TLS-RPT)" : "Registro complementar",
    help: "Opcional. Pode deixar para depois.",
  };
}

/** Recebe os registros salvos do domínio e devolve na ordem em que devem ser criados. */
export function dnsGuide(rows: DnsRecordInput[], domain: string): DnsGuideRow[] {
  const apex = domain.toLowerCase();
  return rows
    // mail.dominio → mail.dominio não faz sentido (só acontece no próprio domínio do servidor).
    .filter((row) => !(row.type === "CNAME" && row.value.toLowerCase().replace(/\.$/, "") === `${row.name}.${apex}`))
    .map((row) => {
      let value = row.value;
      // O servidor sugere p=reject; começar com p=none evita bloquear e-mails enquanto o DNS propaga.
      if (row.type === "TXT" && row.name === "_dmarc") value = value.replace(/p=(reject|quarantine)/i, "p=none");

      const meta = classify({ ...row, value });
      const srvParts = row.type === "SRV" ? value.split(/\s+/) : [];
      return {
        ...row,
        value,
        ...meta,
        key: `${row.type}|${row.name}|${row.value}`,
        srv:
          srvParts.length >= 4
            ? { priority: srvParts[0], weight: srvParts[1], port: srvParts[2], target: srvParts.slice(3).join(" ") }
            : undefined,
      };
    })
    .sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level) || order(a) - order(b));
}

function order(row: DnsGuideRow) {
  return ["mx", "spf", "dkim", "dmarc"].indexOf(row.check ?? "") + 1 || 9;
}
