"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Domain = { id: string; name: string };
type RecordRow = {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  domain?: { name?: string } | null;
};

export function DnsPanel({
  domains,
  records,
}: {
  domains: Domain[];
  records: RecordRow[];
}) {
  const router = useRouter();
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");
  const [type, setType] = useState("A");
  const [name, setName] = useState("@");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(3600);
  const [priority, setPriority] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/dns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domainId,
        type,
        name,
        value,
        ttl,
        priority: type === "MX" || type === "SRV" ? priority : null,
      }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Falha ao criar registro");
      return;
    }
    setValue("");
    router.refresh();
  }

  async function onDelete(id: string) {
    await fetch(`/api/dns?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onCreate}
        className="grid gap-3 wg-card p-6 md:grid-cols-6"
      >
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="wg-input md:col-span-2"
        >
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="wg-input"
        >
          {["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="nome"
          className="wg-input"
        />
        <input
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="valor"
          className="wg-input md:col-span-2"
        />
        <input
          type="number"
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
          className="wg-input"
        />
        {(type === "MX" || type === "SRV") && (
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            placeholder="prioridade"
            className="wg-input"
          />
        )}
        <button
          disabled={loading || !domainId}
          className="wg-btn disabled:opacity-50 md:col-span-2"
        >
          {loading ? "Salvando..." : "Adicionar registro"}
        </button>
      </form>

      {error ? <p className="wg-alert-error">{error}</p> : null}

      <div className="overflow-hidden wg-card">
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
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhum registro DNS.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-wg-border last:border-0">
                  <td className="px-4 py-3">{record.domain?.name ?? "—"}</td>
                  <td className="px-4 py-3">{record.type}</td>
                  <td className="px-4 py-3">{record.name}</td>
                  <td className="px-4 py-3 break-all">{record.value}</td>
                  <td className="px-4 py-3">{record.ttl}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(record.id)}
                      className="text-sm font-medium text-red-600"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
