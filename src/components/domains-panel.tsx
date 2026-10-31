"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

type Domain = {
  id: string;
  name: string;
  status: string;
  source: string;
  nameservers: string[] | null;
  expires_at: string | null;
};

type SuggestedDns = {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  purpose: string;
};

export function DomainsPanel({
  domains,
  maxDomains,
}: {
  domains: Domain[];
  maxDomains: number | null;
  entitled?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "add" | "register" | "transfer" | "manage">("list");
  const [name, setName] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [selectedId, setSelectedId] = useState(domains[0]?.id ?? "");
  const [nameservers, setNameservers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [suggestedDns, setSuggestedDns] = useState<SuggestedDns[]>([]);
  const [suggestedDomain, setSuggestedDomain] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function submit(action: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    setError(null);
    setInfo(null);
    setSuggestedDns([]);
    const response = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, name, authCode, ...extra }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Falha na operação");
      return;
    }

    if (payload.suggestedDns?.length) {
      setSuggestedDns(payload.suggestedDns);
      setSuggestedDomain(payload.domain?.name || name);
      setInfo(
        "Domínio adicionado. Cadastre os DNS abaixo no provedor onde o domínio está hospedado.",
      );
    } else if (action === "register" || action === "transfer") {
      setInfo("Pedido criado. Abra Domínios novamente para ver os DNS gerados.");
    } else {
      setInfo("Nameservers atualizados.");
    }

    setName("");
    setAuthCode("");
    router.refresh();
    if (action !== "nameservers") setTab("list");
  }

  async function saveNameservers(event: FormEvent) {
    event.preventDefault();
    await submit("nameservers", {
      domainId: selectedId,
      nameservers: nameservers.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  }

  function copyDnsTable() {
    const text = suggestedDns
      .map((row) =>
        [
          row.type,
          row.name,
          row.value,
          row.ttl,
          row.priority ?? "",
          row.purpose,
        ].join("\t"),
      )
      .join("\n");
    void navigator.clipboard.writeText(
      `Tipo\tHost\tValor\tTTL\tPrioridade\tUso\n${text}`,
    );
    setInfo("DNS copiados. Cole no painel do seu provedor de DNS.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ["list", "Meus domínios"],
          ["add", "Trazer domínio"],
          ["register", "Registrar novo"],
          ["transfer", "Transferir"],
          ["manage", "Gerenciar NS"],
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

      <div className="wg-card p-4 text-sm text-wg-text-muted">
        Domínios na conta:{" "}
        <strong className="text-wg-graphite">{domains.length}</strong>
        {maxDomains == null ? " · sem limite" : ` / ${maxDomains}`}. A cada domínio
        geramos os DNS para cadastrar no provedor.
      </div>

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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyDnsTable}
                className="rounded-xl border border-wg-border px-3.5 py-2 text-sm font-medium text-wg-graphite"
              >
                Copiar DNS
              </button>
              <Link
                href="/dns"
                className="wg-btn px-3.5 py-2"
              >
                Abrir gerenciador DNS
              </Link>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-wg-border text-wg-text-muted">
                <tr>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Host</th>
                  <th className="px-2 py-2">Valor</th>
                  <th className="px-2 py-2">TTL</th>
                  <th className="px-2 py-2">Prioridade</th>
                  <th className="px-2 py-2">Para que serve</th>
                </tr>
              </thead>
              <tbody>
                {suggestedDns.map((row) => (
                  <tr key={`${row.type}-${row.name}-${row.value}`} className="border-b border-wg-border last:border-0">
                    <td className="px-2 py-2 font-medium text-wg-graphite">{row.type}</td>
                    <td className="px-2 py-2">{row.name}</td>
                    <td className="px-2 py-2 break-all font-mono text-xs">{row.value}</td>
                    <td className="px-2 py-2">{row.ttl}</td>
                    <td className="px-2 py-2">{row.priority ?? "—"}</td>
                    <td className="px-2 py-2 text-wg-text-muted">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "list" ? (
        <div className="overflow-hidden wg-card">
          <table className="w-full text-left text-sm">
            <thead className="wg-table-head">
              <tr>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Nameservers</th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-wg-text-muted">
                    Nenhum domínio na conta ainda.
                  </td>
                </tr>
              ) : (
                domains.map((domain) => (
                  <tr key={domain.id} className="border-b border-wg-border last:border-0">
                    <td className="px-4 py-3 font-medium text-wg-graphite">{domain.name}</td>
                    <td className="px-4 py-3">{domain.source}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={domain.status}
                        label={domain.status === "pending" ? "Aguardando DNS" : undefined}
                      />
                    </td>
                    <td className="px-4 py-3 text-wg-text-muted">
                      {(domain.nameservers || []).join(", ") || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "add" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit("add_external");
          }}
          className="space-y-3 wg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">Trazer domínio existente</h2>
          <p className="text-sm text-wg-text-muted">
            Informe o domínio. Vamos gerar automaticamente os DNS (MX, SPF, DMARC e CNAMEs) para
            você cadastrar no provedor atual.
          </p>
          <input
            required
            placeholder="empresa.com.br"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full wg-input"
          />
          <button
            disabled={loading}
            className="wg-btn disabled:opacity-50"
          >
            {loading ? "Gerando DNS..." : "Adicionar e gerar DNS"}
          </button>
        </form>
      ) : null}

      {tab === "register" || tab === "transfer" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(tab === "register" ? "register" : "transfer");
          }}
          className="space-y-3 wg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">
            {tab === "register" ? "Registrar novo domínio" : "Transferir domínio"}
          </h2>
          <p className="text-sm text-wg-text-muted">
            {tab === "register" ? "Registro" : "Transferência"} com cobrança Assas. Após a
            confirmação, os DNS de e-mail também são gerados.
          </p>
          <input
            required
            placeholder="novodominio.com.br"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full wg-input"
          />
          {tab === "transfer" ? (
            <input
              required
              placeholder="Código EPP / Auth Code"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full wg-input"
            />
          ) : null}
          <button
            disabled={loading}
            className="wg-btn disabled:opacity-50"
          >
            {loading ? "Processando..." : "Continuar"}
          </button>
        </form>
      ) : null}

      {tab === "manage" ? (
        <form
          onSubmit={saveNameservers}
          className="space-y-3 wg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">Gerenciar nameservers</h2>
          {domains.length === 0 ? (
            <p className="text-sm text-wg-text-muted">Nenhum domínio para gerenciar.</p>
          ) : (
            <>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  const current = domains.find((d) => d.id === e.target.value);
                  setNameservers((current?.nameservers || []).join("\n"));
                }}
                className="w-full wg-input"
              >
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                placeholder={"ns1.webgeele.com.br\nns2.webgeele.com.br"}
                value={nameservers}
                onChange={(e) => setNameservers(e.target.value)}
                className="w-full wg-input"
              />
              <button
                disabled={loading || !selectedId}
                className="wg-btn disabled:opacity-50"
              >
                Salvar nameservers
              </button>
            </>
          )}
        </form>
      ) : null}

      {error ? <p className="wg-alert-error">{error}</p> : null}
      {info ? <p className="wg-alert-success">{info}</p> : null}
    </div>
  );
}
