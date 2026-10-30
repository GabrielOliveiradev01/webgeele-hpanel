"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
};

export function SupportPanel({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, priority }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Falha ao abrir chamado");
      return;
    }
    setSubject("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-wg-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Novo chamado</h2>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto"
          className="w-full rounded-xl border border-wg-border bg-wg-surface px-3 py-2.5 text-sm"
        />
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Descreva sua solicitação"
          className="w-full rounded-xl border border-wg-border bg-wg-surface px-3 py-2.5 text-sm"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-xl border border-wg-border bg-wg-surface px-3 py-2.5 text-sm"
        >
          <option value="low">Baixa</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
        </select>
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button
          disabled={loading}
          className="rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Abrir chamado"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-wg-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-wg-border bg-wg-surface/70 text-wg-text-muted">
            <tr>
              <th className="px-4 py-3">Assunto</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhum chamado ainda.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-wg-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-wg-graphite">{ticket.subject}</p>
                    <p className="text-wg-text-muted">{ticket.message}</p>
                  </td>
                  <td className="px-4 py-3">{ticket.priority}</td>
                  <td className="px-4 py-3">{ticket.status}</td>
                  <td className="px-4 py-3">
                    {new Date(ticket.created_at).toLocaleString("pt-BR")}
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
