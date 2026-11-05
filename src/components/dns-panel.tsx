"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Domain = { id: string; name: string };
type RecordRow = {
  id: string;
  domain_id?: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  domain?: { name?: string } | null;
};

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"] as const;

const VALUE_HINT: Record<string, string> = {
  A: "Endereço IPv4, ex.: 203.0.113.10",
  AAAA: "Endereço IPv6, ex.: 2001:db8::1",
  CNAME: "Outro nome de host, ex.: site.exemplo.com.br",
  MX: "Servidor de e-mail, ex.: mail.webgeele.com.br",
  TXT: "Texto livre, ex.: v=spf1 mx ~all",
  NS: "Servidor de nomes, ex.: ns1.exemplo.com.br",
  SRV: "peso porta destino, ex.: 0 443 sip.exemplo.com.br",
};

const TTL_OPTIONS = [
  { value: 300, label: "5 minutos" },
  { value: 3600, label: "1 hora" },
  { value: 14400, label: "4 horas" },
  { value: 86400, label: "1 dia" },
];

function validate(type: string, value: string) {
  const v = value.trim();
  if (!v) return "Informe o valor do registro.";
  if (type === "A" && !/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return "Use um IPv4 válido, ex.: 203.0.113.10";
  if (type === "AAAA" && !v.includes(":")) return "Use um IPv6 válido, ex.: 2001:db8::1";
  if (["CNAME", "MX", "NS"].includes(type) && !/^[a-z0-9.-]+\.[a-z]{2,}\.?$/i.test(v)) {
    return "Use um nome de host válido, ex.: mail.webgeele.com.br";
  }
  return null;
}

export function DnsPanel({
  domains,
  records,
}: {
  domains: Domain[];
  records: RecordRow[];
}) {
  // A lista é mantida aqui para o registro aparecer na hora, sem depender de recarregar a página.
  const [rows, setRows] = useState(records);
  const [filter, setFilter] = useState("all");
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");
  const [type, setType] = useState<string>("A");
  const [name, setName] = useState("@");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(3600);
  const [priority, setPriority] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const domainName = (id: string | undefined) => domains.find((d) => d.id === id)?.name;
  const selectedDomain = domainName(domainId);
  const needsPriority = type === "MX" || type === "SRV";

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.domain_id === filter)),
    [rows, filter],
  );

  const fqdn = useMemo(() => {
    if (!selectedDomain) return "";
    const host = name.trim();
    return !host || host === "@" ? selectedDomain : `${host}.${selectedDomain}`;
  }, [name, selectedDomain]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const problem = validate(type, value);
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId,
          type,
          name: name.trim() || "@",
          value: value.trim(),
          ttl,
          priority: needsPriority ? priority : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Não foi possível salvar o registro.");
        return;
      }
      setRows((list) => [{ ...payload.record, domain: { name: selectedDomain } }, ...list]);
      setInfo(`Registro ${type} de ${fqdn} salvo.`);
      setValue("");
    } catch {
      setError("Sem conexão com o painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(record: RecordRow) {
    if (!window.confirm(`Excluir o registro ${record.type} "${record.name}"?`)) return;
    setDeleting(record.id);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch(`/api/dns?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Não foi possível excluir o registro.");
        return;
      }
      setRows((list) => list.filter((row) => row.id !== record.id));
    } finally {
      setDeleting(null);
    }
  }

  if (domains.length === 0) {
    return (
      <div className="wg-card p-6">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Nenhum domínio na conta</h2>
        <p className="mt-2 text-sm text-wg-text-muted">
          Adicione um domínio em{" "}
          <Link href="/dominios" className="font-medium text-wg-brand underline">
            Domínios
          </Link>{" "}
          para gerenciar os registros DNS dele.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="wg-card p-6">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Novo registro</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <label className="block md:col-span-3">
            <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">Domínio</span>
            <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="wg-input">
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">Tipo</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="wg-input">
              {RECORD_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-3">
            <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="@ ou www"
              className="wg-input"
            />
          </label>
          <label className="block md:col-span-4">
            <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">Valor</span>
            <input
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={VALUE_HINT[type]}
              className="wg-input"
            />
          </label>
          <label className="block md:col-span-3">
            <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">TTL</span>
            <select value={ttl} onChange={(e) => setTtl(Number(e.target.value))} className="wg-input">
              {TTL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {needsPriority ? (
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-wg-text-muted">Prioridade</span>
              <input
                type="number"
                min={0}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="wg-input"
              />
            </label>
          ) : null}
          <div className="flex items-end md:col-span-3">
            <button disabled={loading || !domainId} className="wg-btn w-full">
              <Plus className="h-4 w-4" />
              {loading ? "Salvando..." : "Adicionar registro"}
            </button>
          </div>
        </div>
        {fqdn ? (
          <p className="mt-3 text-xs text-wg-text-muted">
            Responde por <strong className="text-wg-graphite">{fqdn}</strong>. Use @ para o domínio raiz.
          </p>
        ) : null}
      </form>

      {error ? <p role="alert" className="wg-alert-error">{error}</p> : null}
      {info ? <p className="wg-alert-success">{info}</p> : null}

      <div className="overflow-hidden wg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-wg-border/70 px-4 py-3">
          <p className="text-sm font-semibold text-wg-graphite">
            Registros <span className="font-normal text-wg-text-muted">({visible.length})</span>
          </p>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="wg-input w-auto py-1.5 text-xs"
            aria-label="Filtrar por domínio"
          >
            <option value="all">Todos os domínios</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="wg-table-head">
              <tr>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">TTL</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-wg-text-muted">
                    Nenhum registro DNS.
                  </td>
                </tr>
              ) : (
                visible.map((record) => (
                  <tr key={record.id} className="border-b border-wg-border/70 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.domain?.name ?? domainName(record.domain_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-wg-brand/[0.08] px-2 py-0.5 text-xs font-semibold text-wg-brand">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{record.name}</td>
                    <td className="max-w-[320px] px-4 py-3 font-mono text-xs break-all">
                      {record.priority !== null && record.priority !== undefined ? `${record.priority} ` : ""}
                      {record.value}
                    </td>
                    <td className="px-4 py-3 text-wg-text-muted">{record.ttl}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(record)}
                        disabled={deleting === record.id}
                        aria-label={`Excluir registro ${record.type} ${record.name}`}
                        className="rounded-lg p-1.5 text-wg-text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
