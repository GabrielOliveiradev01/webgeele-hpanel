"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

type Domain = {
  id: string;
  name: string;
  status: string;
};

type DnsRow = {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  purpose?: string;
};

type StoredDnsRow = DnsRow & { domain_id?: string };

function copyRows(rows: DnsRow[]) {
  const text = rows
    .map((row) => [row.type, row.name, row.value, row.ttl, row.priority ?? ""].join("\t"))
    .join("\n");
  return navigator.clipboard.writeText(`Tipo\tHost\tValor\tTTL\tPrioridade\n${text}`);
}

function DnsTable({ rows }: { rows: DnsRow[] }) {
  const showPurpose = rows.some((row) => row.purpose);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-wg-border text-wg-text-muted">
          <tr>
            <th className="px-2 py-2">Tipo</th>
            <th className="px-2 py-2">Host</th>
            <th className="px-2 py-2">Valor</th>
            <th className="px-2 py-2">TTL</th>
            <th className="px-2 py-2">Prioridade</th>
            {showPurpose ? <th className="px-2 py-2">Para que serve</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.type}-${row.name}-${row.value}`}
              className="border-b border-wg-border last:border-0"
            >
              <td className="px-2 py-2 font-medium text-wg-graphite">{row.type}</td>
              <td className="px-2 py-2">{row.name}</td>
              <td className="px-2 py-2 break-all font-mono text-xs">{row.value}</td>
              <td className="px-2 py-2">{row.ttl}</td>
              <td className="px-2 py-2">{row.priority ?? "—"}</td>
              {showPurpose ? (
                <td className="px-2 py-2 text-wg-text-muted">{row.purpose ?? ""}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DomainsPanel({
  domains,
  dnsRecords,
}: {
  domains: Domain[];
  dnsRecords: StoredDnsRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "add">("list");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [suggestedDns, setSuggestedDns] = useState<DnsRow[]>([]);
  const [suggestedDomain, setSuggestedDomain] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addDomain() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setSuggestedDns([]);
    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_external", name }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Não foi possível adicionar o domínio.");
        return;
      }
      setSuggestedDns(payload.suggestedDns ?? []);
      setSuggestedDomain(payload.domain?.name || name);
      setInfo("Domínio adicionado. Cadastre os registros abaixo onde o domínio está hospedado.");
      setName("");
      setTab("list");
      router.refresh();
    } catch {
      setError("Sem conexão com o painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy(rows: DnsRow[]) {
    await copyRows(rows);
    setInfo("Registros copiados. Cole no painel do seu provedor de DNS.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ["list", "Meus domínios"],
          ["add", "Adicionar domínio"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as typeof tab)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium ${
              tab === key
                ? "bg-wg-brand text-white"
                : "border border-wg-border bg-white text-wg-graphite"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p role="alert" className="wg-alert-error">{error}</p> : null}
      {info ? <p className="wg-alert-success">{info}</p> : null}

      {suggestedDns.length > 0 ? (
        <div className="rounded-2xl border border-wg-brand/30 bg-white p-6 shadow-[0_10px_30px_rgba(102,60,230,0.10)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-wg-graphite">
                DNS para {suggestedDomain}
              </h2>
              <p className="mt-1 text-sm text-wg-text-muted">
                Cadastre estes registros no DNS do domínio (Registro.br, Cloudflare, Hostinger,
                etc.), incluindo MX, SPF, DKIM e DMARC. Depois disso o e-mail passa a funcionar.
              </p>
            </div>
            <button type="button" onClick={() => onCopy(suggestedDns)} className="wg-btn-secondary px-3.5 py-2">
              Copiar DNS
            </button>
          </div>
          <div className="mt-4">
            <DnsTable rows={suggestedDns} />
          </div>
        </div>
      ) : null}

      {tab === "list" ? (
        <div className="overflow-hidden wg-card">
          <table className="w-full text-left text-sm">
            <thead className="wg-table-head">
              <tr>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-wg-text-muted">
                    Nenhum domínio na conta ainda.
                  </td>
                </tr>
              ) : (
                domains.map((domain) => {
                  const rows = dnsRecords.filter((row) => row.domain_id === domain.id);
                  const open = openId === domain.id;
                  return [
                    <tr key={domain.id} className="border-b border-wg-border last:border-0">
                      <td className="px-4 py-3 font-medium text-wg-graphite">{domain.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={domain.status}
                          label={domain.status === "pending" ? "Aguardando DNS" : undefined}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rows.length ? (
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : domain.id)}
                            className="text-sm font-semibold text-wg-brand hover:underline"
                          >
                            {open ? "Ocultar DNS" : "Ver DNS"}
                          </button>
                        ) : null}
                      </td>
                    </tr>,
                    open ? (
                      <tr key={`${domain.id}-dns`} className="border-b border-wg-border bg-wg-surface/60">
                        <td colSpan={3} className="px-4 py-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-wg-text-muted">
                              Cadastre estes registros onde o domínio está hospedado.
                            </p>
                            <button
                              type="button"
                              onClick={() => onCopy(rows)}
                              className="wg-btn-secondary px-3 py-1.5 text-xs"
                            >
                              Copiar DNS
                            </button>
                          </div>
                          <DnsTable rows={rows} />
                        </td>
                      </tr>
                    ) : null,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "add" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addDomain();
          }}
          className="space-y-3 wg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">Adicionar domínio</h2>
          <p className="text-sm text-wg-text-muted">
            Informe um domínio que você já tem. Vamos gerar os registros de e-mail (MX, SPF, DKIM e
            DMARC) para você cadastrar no provedor onde ele está hospedado.
          </p>
          <input
            required
            placeholder="empresa.com.br"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full wg-input"
          />
          <button disabled={loading} className="wg-btn disabled:opacity-50">
            {loading ? "Gerando DNS..." : "Adicionar e gerar DNS"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
